function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function inferLabelFromMetadata({ garment_type = '', fabric_hint = '' }) {
  const g = garment_type.toLowerCase();
  const f = fabric_hint.toLowerCase();

  if (g.includes('shirt') || g.includes('tshirt')) return 'Sweat / Body Oil';
  if (g.includes('saree') || g.includes('silk') || f.includes('silk')) return 'Oil / Grease';
  if (g.includes('jacket') || g.includes('coat')) return 'Mud / Soil';
  if (g.includes('uniform') || g.includes('trouser')) return 'Ink / Pen';
  return randomFrom(['Oil / Grease', 'Ink / Pen', 'Wine', 'Curry', 'Blood']);
}

export async function runStubStainAnalysis(payload = {}) {
  const startedAt = Date.now();
  const primaryLabel = inferLabelFromMetadata(payload);
  const confidence = clamp(0.66 + Math.random() * 0.28, 0.66, 0.94);
  const requestId =
    payload.request_id || `stub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const primaryType =
    {
      'Oil / Grease': 'oil_grease',
      'Ink / Pen': 'ink',
      Wine: 'wine',
      Curry: 'curry',
      Blood: 'blood',
      'Mud / Soil': 'soil_mud',
      'Sweat / Body Oil': 'body_oil',
    }[primaryLabel] || 'unknown';

  const recommendationsByType = {
    oil_grease: [
      {
        chemical: 'Perchloroethylene (Perc)',
        method: 'Solvent Pre-Treatment',
        priority: 1,
        safety_notes: 'Use in ventilated area. Avoid use on delicate trims.',
        estimated_success_rate: 0.9,
      },
      {
        chemical: 'K2R Spot Lifter',
        method: 'Spot Application',
        priority: 2,
        safety_notes: 'Patch test on color-sensitive garments first.',
        estimated_success_rate: 0.78,
      },
    ],
    ink: [
      {
        chemical: 'Isopropyl Alcohol Blend',
        method: 'Spot Application + Blot',
        priority: 1,
        safety_notes: 'Keep away from open flame.',
        estimated_success_rate: 0.82,
      },
    ],
    wine: [
      {
        chemical: 'Hydrogen Peroxide Dilution',
        method: 'Oxidizing Spot Treatment',
        priority: 1,
        safety_notes: 'Do not use on dark dyes without spot test.',
        estimated_success_rate: 0.8,
      },
    ],
    curry: [
      {
        chemical: 'Enzyme Detergent',
        method: 'Pre-Soak + Mild Agitation',
        priority: 1,
        safety_notes: 'Rinse thoroughly before machine wash.',
        estimated_success_rate: 0.84,
      },
    ],
    blood: [
      {
        chemical: 'Cold Water + Protease Agent',
        method: 'Cold Spot Treatment',
        priority: 1,
        safety_notes: 'Never use hot water on fresh blood stains.',
        estimated_success_rate: 0.87,
      },
    ],
    soil_mud: [
      {
        chemical: 'Mild Alkaline Detergent',
        method: 'Dry Brush + Pre-Wash',
        priority: 1,
        safety_notes: 'Brush off dry residue before wet processing.',
        estimated_success_rate: 0.85,
      },
    ],
    body_oil: [
      {
        chemical: 'Degreasing Surfactant',
        method: 'Collar/Cuff Spot Treatment',
        priority: 1,
        safety_notes: 'Avoid over-saturation on delicate fabrics.',
        estimated_success_rate: 0.83,
      },
    ],
    unknown: [
      {
        chemical: 'Neutral Spotter',
        method: 'General Pre-Treatment',
        priority: 1,
        safety_notes: 'Apply conservative cycle and inspect manually.',
        estimated_success_rate: 0.6,
      },
    ],
  };

  return {
    request_id: requestId,
    stain_detected: true,
    confidence: Number(confidence.toFixed(2)),
    stains: [
      {
        type: primaryType,
        label: primaryLabel,
        confidence: Number(confidence.toFixed(2)),
        bounding_box: { x: 120, y: 190, w: 160, h: 110 },
      },
    ],
    recommendations: recommendationsByType[primaryType] || recommendationsByType.unknown,
    model_version: 'stub-0.1.0',
    processing_time_ms: Date.now() - startedAt,
    provider: 'stub',
  };
}
