// Agent Savage - Pattern Rendering Edge Function
// Real-time SVG pattern generation without LLM

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PatternParams {
  spacing: number
  rotation: number
  scale: number
  strokeWidth: number
  opacity: number
}

interface BrandConfig {
  primary_color: string
  secondary_color: string
  accent_color?: string
  font_family?: string
}

// Pattern generation functions
function generateGridStripes(params: PatternParams, brand: BrandConfig): string {
  const width = 800
  const height = 600
  const patternSize = params.spacing * 2
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="gridStripes" x="0" y="0" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="${patternSize}" y2="${patternSize}" 
                stroke="${brand.primary_color}" stroke-width="${params.strokeWidth}" />
          <line x1="${patternSize}" y1="0" x2="0" y2="${patternSize}" 
                stroke="${brand.secondary_color}" stroke-width="${params.strokeWidth}" />
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#gridStripes)" 
            transform="rotate(${params.rotation} ${width/2} ${height/2})" 
            opacity="${params.opacity}" />
    </svg>
  `
}

function generateDotMatrix(params: PatternParams, brand: BrandConfig): string {
  const width = 800
  const height = 600
  const dotRadius = params.spacing / 4
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dotMatrix" x="0" y="0" width="${params.spacing}" height="${params.spacing}" patternUnits="userSpaceOnUse">
          <circle cx="${params.spacing/2}" cy="${params.spacing/2}" r="${dotRadius * params.scale}" 
                  fill="${brand.primary_color}" opacity="${params.opacity}" />
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="${brand.secondary_color}" />
      <rect width="${width}" height="${height}" fill="url(#dotMatrix)" />
    </svg>
  `
}

function generateWaveFlow(params: PatternParams, brand: BrandConfig): string {
  const width = 800
  const height = 600
  const amplitude = params.spacing * 2
  const frequency = 0.02
  
  // Generate wave paths
  const waves = []
  for (let i = 0; i < 5; i++) {
    const offset = i * params.spacing
    const color = i % 2 === 0 ? brand.primary_color : brand.secondary_color
    
    let path = `M 0 ${height/2 + offset - 2*params.spacing}`
    for (let x = 0; x <= width; x += 10) {
      const y = height/2 + amplitude * Math.sin(frequency * x + params.rotation * Math.PI / 180) + offset - 2*params.spacing
      path += ` L ${x} ${y}`
    }
    
    waves.push(`
      <path d="${path}" stroke="${color}" stroke-width="${params.strokeWidth}" 
            fill="none" opacity="${params.opacity}" />
    `)
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${brand.accent_color || '#f0f0f0'}" />
      ${waves.join('')}
    </svg>
  `
}

function generateDataBars(params: PatternParams, brand: BrandConfig, data?: number[]): string {
  const width = 800
  const height = 600
  const barWidth = params.spacing
  const maxHeight = height * 0.8
  
  // Use provided data or generate sample data
  const values = data || Array.from({length: Math.floor(width / barWidth)}, () => Math.random())
  
  const bars = values.map((value, index) => {
    const barHeight = value * maxHeight
    const x = index * barWidth
    const y = height - barHeight
    const color = index % 2 === 0 ? brand.primary_color : brand.secondary_color
    
    return `
      <rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}"
            fill="${color}" opacity="${params.opacity}" />
    `
  }).join('')
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${brand.accent_color || '#ffffff'}" />
      ${bars}
    </svg>
  `
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { template_id, params, brand_config, data } = await req.json()

    // Validate inputs
    if (!template_id || !params || !brand_config) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate pattern based on template
    let svgContent: string
    
    switch (template_id) {
      case 'grid-stripes':
        svgContent = generateGridStripes(params, brand_config)
        break
      case 'dot-matrix':
        svgContent = generateDotMatrix(params, brand_config)
        break
      case 'wave-flow':
        svgContent = generateWaveFlow(params, brand_config)
        break
      case 'data-bars':
        svgContent = generateDataBars(params, brand_config, data)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown template' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Optional: Save to Supabase if project_id provided
    if (req.headers.get('x-project-id')) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase
        .from('patterns')
        .insert({
          project_id: req.headers.get('x-project-id'),
          template_id,
          params,
          svg_content: svgContent
        })
        .select()
    }

    // Return SVG content
    return new Response(svgContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})