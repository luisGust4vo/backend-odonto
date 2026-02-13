import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  dentalChat(message?: string) {
    return {
      answer:
        'Análise preliminar concluída. Foi detectada uma região de atenção compatível com alteração em tecido dentário. Correlacionar com exame clínico e histórico do paciente.',
      diagnosis: 'Possível cárie proximal em estágio inicial/moderado.',
      findings: [
        {
          id: 'finding-1',
          label: 'Região suspeita 1',
          severity: 'media',
          confidence: 0.83,
          circle: { cx: 46, cy: 44, r: 12 },
          note:
            message ||
            'Área com radiolucidez sugestiva de lesão cariosa proximal.',
        },
      ],
      report: {
        summary:
          'Imagem com área focal de alteração de contraste/radiolucidez em região proximal.',
        possibleDiagnosis: 'Cárie proximal (hipótese inicial).',
        urgency: 'Média',
        confidence: '83%',
        recommendations: [
          'Confirmar com exame clínico intraoral.',
          'Avaliar necessidade de radiografia complementar.',
          'Definir conduta restauradora conforme profundidade da lesão.',
        ],
        disclaimer:
          'Análise gerada por IA para apoio clínico. Não substitui avaliação odontológica presencial.',
      },
    };
  }
}
