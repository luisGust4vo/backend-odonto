import { BadRequestException, Injectable } from '@nestjs/common';
import { SearchProductsDto } from './dto/search-products.dto';

type ProductItem = {
  id: string;
  name: string;
  category: string;
  supplier: string;
  price: number;
  pixPrice?: number;
  cardPrice?: number;
  pixDiscountPercent?: number;
  shipping: number;
  rating: number;
  source: string;
  updatedAt: string;
};

type JsonLdProduct = {
  '@type'?: string | string[];
  name?: string;
  offers?:
    | {
        price?: string | number;
        url?: string;
        priceSpecification?: Array<{
          price?: string | number;
          description?: string;
          name?: string;
        }>;
      }
    | Array<{
        price?: string | number;
        url?: string;
        priceSpecification?: Array<{
          price?: string | number;
          description?: string;
          name?: string;
        }>;
      }>;
  aggregateRating?: {
    ratingValue?: string | number;
  };
  products?: Array<{
    name?: string;
    url?: string;
    offers?: {
      lowPrice?: string | number;
      highPrice?: string | number;
      offers?:
        | Array<{
            price?: string | number;
            url?: string;
            priceSpecification?: Array<{
              price?: string | number;
              description?: string;
              name?: string;
            }>;
          }>
        | {
            price?: string | number;
            url?: string;
            priceSpecification?: Array<{
              price?: string | number;
              description?: string;
              name?: string;
            }>;
          };
    };
  }>;
};

@Injectable()
export class CrawlerService {
  private readonly timeoutMs = Number(process.env.CRAWLER_TIMEOUT_MS ?? 4500);
  private readonly browserUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
  private readonly defaultSources = [
    'https://www.dentalcremer.com.br/catalogsearch/result/?q={q}',
    'https://www.dentalpartner.com.br/catalogsearch/result?q={q}',
    'https://www.dentalspeed.com/catalogsearch/result/?q={q}',
  ];

  async searchProducts(dto: SearchProductsDto) {
    const query = dto.q?.trim();
    if (!query) {
      throw new BadRequestException('Parâmetro "q" é obrigatório.');
    }

    const sources = this.resolveSources(dto.sources);
    if (!sources.length) {
      throw new BadRequestException(
        'Informe "sources" na query ou defina PRODUCT_CRAWLER_SOURCES no .env.',
      );
    }

    const settled = await Promise.allSettled(
      sources.map((rawSource) => this.crawlSource(rawSource, query, dto.category)),
    );

    const merged = settled.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );

    const maxPrice =
      typeof dto.maxPrice === 'number' && Number.isFinite(dto.maxPrice)
        ? dto.maxPrice
        : Number.POSITIVE_INFINITY;
    const limit = Math.min(dto.limit && dto.limit > 0 ? dto.limit : 8, 8);
    const filtered = merged.filter((item) => item.price <= maxPrice);
    const deduped = this.dedupeAndSort(filtered);
    const balanced = this.pickTopPerSite(deduped, 3);
    const normalized = balanced.slice(0, limit);

    return {
      query,
      totalSources: sources.length,
      totalResults: normalized.length,
      results: normalized,
    };
  }

  private resolveSources(inlineSources?: string[]) {
    if (Array.isArray(inlineSources) && inlineSources.length) {
      return inlineSources;
    }

    const fromEnv = (process.env.PRODUCT_CRAWLER_SOURCES ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return fromEnv.length ? fromEnv : this.defaultSources;
  }

  private async crawlSource(
    rawSource: string,
    query: string,
    category?: string,
  ): Promise<ProductItem[]> {
    const targetUrl = this.buildTargetUrl(rawSource, query);
    const sourceHost = new URL(targetUrl).hostname.replace(/^www\./, '');
    const response = await this.fetchContent(targetUrl);
    const isDentalCremer = sourceHost.includes('dentalcremer.com.br');

    if (isDentalCremer && targetUrl.includes('/catalogsearch/result')) {
      const products = await this.extractDentalCremerProducts(response.body);
      return products.filter((item) =>
        this.matchesCategoryAndQuery(item, category?.trim().toLowerCase(), query),
      );
    }

    const extracted = response.contentType.includes('application/json')
      ? this.extractProductsFromJsonApi(response.body, targetUrl)
      : this.extractProductsFromJsonLd(response.body, targetUrl);

    return extracted
      .filter((item) =>
        this.matchesCategoryAndQuery(item, category?.trim().toLowerCase(), query),
      )
      .map((item, index) => ({
        ...item,
        id: `${this.slug(item.supplier)}-${Date.now()}-${index}`,
      }));
  }

  private async extractDentalCremerProducts(searchHtml: string): Promise<ProductItem[]> {
    if (!searchHtml) return [];

    const linkRegex =
      /href="(https:\/\/www\.dentalcremer\.com\.br\/[a-z0-9\-]+-dc\d+\.html)"/gi;
    const urls = new Set<string>();
    let match = linkRegex.exec(searchHtml);
    while (match) {
      urls.add(match[1]);
      match = linkRegex.exec(searchHtml);
    }

    const candidates = [...urls].slice(0, 6);
    const settled = await Promise.allSettled(
      candidates.map((url) => this.fetchDentalCremerProduct(url)),
    );

    return settled
      .flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
      .filter((item): item is ProductItem => Boolean(item));
  }

  private async fetchDentalCremerProduct(url: string): Promise<ProductItem | null> {
    const response = await this.fetchContent(url);
    const html = response.body;
    if (!html) return null;

    const titleMatch = html.match(
      /<meta\s+property="og:title"\s+content="([^"]+)"/i,
    );
    const fallbackTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const name = (titleMatch?.[1] || fallbackTitleMatch?.[1] || '')
      .replace(/\s+/g, ' ')
      .trim();

    const priceMatch = html.match(
      /window\.linxMeta\s*=\s*\{[^}]*"price":\s*([0-9]+(?:\.[0-9]+)?)/i,
    );
    const cardMetaMatch = html.match(
      /<meta\s+property="product:price:amount"\s+content="([^"]+)"/i,
    );
    const pixPrice = this.extractPixPriceFromHtml(html);
    const cardInlinePrice = this.extractCardPriceFromHtml(html);
    const cardPrice = this.toNumber(
      cardInlinePrice || cardMetaMatch?.[1] || priceMatch?.[1],
    );
    const price = this.pickEffectivePrice(pixPrice, cardPrice);
    const pixDiscountPercent = this.computePixDiscountPercent(pixPrice, cardPrice);

    if (!name || !Number.isFinite(price) || price <= 0) {
      return null;
    }

    return {
      id: `dentalcremer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      category: 'Todos',
      supplier: 'dentalcremer.com.br',
      price,
      pixPrice: Number.isFinite(pixPrice) ? pixPrice : undefined,
      cardPrice: Number.isFinite(cardPrice) ? cardPrice : undefined,
      pixDiscountPercent,
      shipping: 0,
      rating: 0,
      source: url,
      updatedAt: new Date().toISOString(),
    };
  }

  private buildTargetUrl(rawSource: string, query: string) {
    if (!/^https?:\/\//i.test(rawSource)) {
      throw new BadRequestException(`Fonte inválida: ${rawSource}`);
    }

    if (rawSource.includes('{q}')) {
      return rawSource.replace('{q}', encodeURIComponent(query));
    }

    const url = new URL(rawSource);
    if (!url.searchParams.has('q')) {
      url.searchParams.set('q', query);
    }
    return url.toString();
  }

  private async fetchContent(url: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'User-Agent': this.browserUserAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return { body: '', contentType: '' };
      }

      const contentType = response.headers.get('content-type') ?? '';
      const body = await response.text();
      return { body, contentType };
    } catch {
      return { body: '', contentType: '' };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private extractProductsFromJsonApi(body: string, sourceUrl: string): ProductItem[] {
    const parsed = this.safeJsonParse(body) as
      | {
          results?: Array<{
            id?: string;
            title?: string;
            price?: number | string;
            shipping?: { free_shipping?: boolean; cost?: number | string };
            seller?: { nickname?: string };
            permalink?: string;
            currency_id?: string;
            category_id?: string;
          }>;
        }
      | null;

    if (!parsed?.results?.length) return [];

    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');
    const now = new Date().toISOString();

    return parsed.results
      .map((item, index) => {
        const price = this.toNumber(item.price);
        if (!Number.isFinite(price) || price <= 0) return null;

        const shippingCost = item.shipping?.free_shipping
          ? 0
          : this.toNumber(item.shipping?.cost);

        return {
          id: item.id || `${hostname}-${Date.now()}-${index}`,
          name: (item.title ?? '').trim(),
          category: item.category_id || 'Todos',
          supplier: hostname,
          price,
          cardPrice: price,
          shipping: Number.isFinite(shippingCost) && shippingCost >= 0 ? shippingCost : 0,
          rating: 0,
          source: item.permalink || sourceUrl,
          updatedAt: now,
        } as ProductItem;
      })
      .filter((item): item is ProductItem => Boolean(item?.name));
  }

  private extractProductsFromJsonLd(html: string, sourceUrl: string): ProductItem[] {
    if (!html) return [];

    const scriptRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const blocks: string[] = [];
    let match: RegExpExecArray | null = scriptRegex.exec(html);
    while (match) {
      blocks.push(match[1]);
      match = scriptRegex.exec(html);
    }

    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');
    const now = new Date().toISOString();
    const products: ProductItem[] = [];

    for (const rawBlock of blocks) {
      const parsed = this.safeJsonParse(rawBlock);
      const candidates = this.normalizeJsonLdCandidates(parsed);

      for (const item of candidates) {
        if (this.isProductListingPage(item)) {
          products.push(...this.extractProductsFromListingPage(item, sourceUrl, now));
          continue;
        }

        if (!this.isProductType(item)) continue;

        const name = (item.name ?? '').trim();
        if (!name) continue;

        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        const cardPrice = this.toNumber(offer?.price);
        const pixPrice = this.extractPixPriceFromSpecs(offer?.priceSpecification);
        const price = this.pickEffectivePrice(pixPrice, cardPrice);
        if (!Number.isFinite(price) || price <= 0) continue;

        const rating = this.toNumber(item.aggregateRating?.ratingValue);
        const source = offer?.url && /^https?:\/\//i.test(offer.url) ? offer.url : sourceUrl;
        const pixDiscountPercent = this.computePixDiscountPercent(pixPrice, cardPrice);

        products.push({
          id: '',
          name,
          category: 'Todos',
          supplier: hostname,
          price,
          pixPrice: Number.isFinite(pixPrice) ? pixPrice : undefined,
          cardPrice: Number.isFinite(cardPrice) ? cardPrice : undefined,
          pixDiscountPercent,
          shipping: 0,
          rating: Number.isFinite(rating) && rating > 0 ? rating : 0,
          source,
          updatedAt: now,
        });
      }
    }

    return products;
  }

  private isProductListingPage(item: JsonLdProduct) {
    const type = item['@type'];
    if (Array.isArray(type)) {
      return type.some(
        (entry) => String(entry).toLowerCase() === 'productlistingpage',
      );
    }
    return String(type ?? '').toLowerCase() === 'productlistingpage';
  }

  private extractProductsFromListingPage(
    item: JsonLdProduct,
    sourceUrl: string,
    now: string,
  ): ProductItem[] {
    if (!Array.isArray(item.products)) return [];

    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');

    return item.products
      .map((product, index) => {
        const name = (product.name ?? '').trim();
        if (!name) return null;

        const rawPrice =
          product.offers?.lowPrice ??
          product.offers?.highPrice ??
          (Array.isArray(product.offers?.offers)
            ? product.offers?.offers[0]?.price
            : product.offers?.offers?.price);

        const cardPrice = this.toNumber(rawPrice);
        const firstOffer = Array.isArray(product.offers?.offers)
          ? product.offers?.offers[0]
          : product.offers?.offers;
        const pixPrice = this.extractPixPriceFromSpecs(firstOffer?.priceSpecification);
        const price = this.pickEffectivePrice(pixPrice, cardPrice);
        if (!Number.isFinite(price) || price <= 0) return null;
        const pixDiscountPercent = this.computePixDiscountPercent(pixPrice, cardPrice);

        return {
          id: `${hostname}-${Date.now()}-${index}`,
          name,
          category: 'Todos',
          supplier: hostname,
          price,
          pixPrice: Number.isFinite(pixPrice) ? pixPrice : undefined,
          cardPrice: Number.isFinite(cardPrice) ? cardPrice : undefined,
          pixDiscountPercent,
          shipping: 0,
          rating: 0,
          source: product.url || sourceUrl,
          updatedAt: now,
        } as ProductItem;
      })
      .filter((entry): entry is ProductItem => Boolean(entry));
  }

  private normalizeJsonLdCandidates(parsed: unknown): JsonLdProduct[] {
    if (!parsed) return [];
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'object') as JsonLdProduct[];
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const root = parsed as Record<string, unknown>;
      const graph = root['@graph'];
      if (Array.isArray(graph)) {
        return graph.filter((item) => typeof item === 'object') as JsonLdProduct[];
      }
      return [root as JsonLdProduct];
    }

    return [];
  }

  private isProductType(item: JsonLdProduct) {
    const type = item['@type'];
    if (Array.isArray(type)) {
      return type.some((entry) => String(entry).toLowerCase() === 'product');
    }
    return String(type ?? '').toLowerCase() === 'product';
  }

  private matchesCategoryAndQuery(
    item: ProductItem,
    category: string | undefined,
    query: string,
  ) {
    const name = this.normalizeText(item.name);
    const tokens = this.normalizeText(query)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2);
    const matchedTokens = tokens.filter((token) => name.includes(token)).length;
    const minimumMatches = tokens.length > 1 ? 1 : tokens.length;
    const queryOk = !tokens.length || matchedTokens >= minimumMatches;
    const normalizedCategory = category ? this.normalizeText(category) : '';
    const categoryOk =
      !normalizedCategory ||
      normalizedCategory === 'todos' ||
      name.includes(normalizedCategory);
    return queryOk && categoryOk;
  }

  private dedupeAndSort(items: ProductItem[]) {
    const map = new Map<string, ProductItem>();

    for (const item of items) {
      const key = `${item.supplier}|${item.name.toLowerCase()}|${item.price.toFixed(2)}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }

    return [...map.values()].sort(
      (a, b) => a.price + a.shipping - (b.price + b.shipping),
    );
  }

  private pickTopPerSite(items: ProductItem[], maxPerSite: number) {
    const grouped = new Map<string, ProductItem[]>();

    for (const item of items) {
      const key = item.supplier.trim().toLowerCase();
      const bucket = grouped.get(key) ?? [];
      bucket.push(item);
      grouped.set(key, bucket);
    }

    const selected: ProductItem[] = [];
    for (const [, bucket] of grouped) {
      const ordered = [...bucket].sort(
        (a, b) => a.price + a.shipping - (b.price + b.shipping),
      );
      selected.push(...ordered.slice(0, maxPerSite));
    }

    return selected.sort(
      (a, b) => a.price + a.shipping - (b.price + b.shipping),
    );
  }

  private pickEffectivePrice(pixPrice: number, cardPrice: number): number {
    if (Number.isFinite(pixPrice) && pixPrice > 0) return pixPrice;
    if (Number.isFinite(cardPrice) && cardPrice > 0) return cardPrice;
    return Number.NaN;
  }

  private extractPixPriceFromSpecs(
    specs?: Array<{ price?: string | number; description?: string; name?: string }>,
  ) {
    if (!Array.isArray(specs)) return Number.NaN;

    for (const spec of specs) {
      const description = `${spec.description ?? ''} ${spec.name ?? ''}`.toLowerCase();
      if (!description.includes('pix')) continue;
      const value = this.toNumber(spec.price);
      if (Number.isFinite(value) && value > 0) return value;
    }

    return Number.NaN;
  }

  private computePixDiscountPercent(pixPrice: number, cardPrice: number) {
    if (!Number.isFinite(pixPrice) || !Number.isFinite(cardPrice)) return undefined;
    if (pixPrice <= 0 || cardPrice <= 0 || pixPrice >= cardPrice) return undefined;
    const raw = ((cardPrice - pixPrice) / cardPrice) * 100;
    return Math.round(raw);
  }

  private extractPixPriceFromHtml(html: string) {
    const patterns = [
      /R\$\s*([\d.,]+)\s*(?:&agrave;|à)\s+vista\s+no\s+Pix/gi,
      /"description":"[^"]*PIX[^"]*".{0,200}?"price":"([\d.]+)"/gi,
      /"price":"([\d.]+)".{0,200}?"description":"[^"]*PIX[^"]*"/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (!match?.[1]) continue;
      const value = this.toNumber(match[1]);
      if (Number.isFinite(value) && value > 0) return value;
    }

    return Number.NaN;
  }

  private extractCardPriceFromHtml(html: string) {
    const patterns = [
      /ou\s+R\$\s*([\d.,]+)\s+em\s+at[eé]\s+\d+x\s+sem\s+juros/gi,
      /no\s+cart[aã]o[^R$]*R\$\s*([\d.,]+)/gi,
      /"description":"[^"]*cart[aã]o[^"]*".{0,180}?"price":"([\d.]+)"/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (!match?.[1]) continue;
      const value = this.toNumber(match[1]);
      if (Number.isFinite(value) && value > 0) return value;
    }

    return Number.NaN;
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private toNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return Number.NaN;

    const sanitized = value.replace(/[^\d.,-]/g, '').trim();
    if (!sanitized) return Number.NaN;

    const hasComma = sanitized.includes(',');
    const hasDot = sanitized.includes('.');
    let cleaned = sanitized;

    if (hasComma && hasDot) {
      cleaned = sanitized.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      cleaned = sanitized.replace(',', '.');
    }

    return Number(cleaned);
  }

  private normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private slug(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
