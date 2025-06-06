import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key é obrigatória' },
        { status: 400 }
      )
    }

    // Teste simples com áudio de exemplo (silence)
    const testAudio = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" // 1 segundo de silêncio em base64

    console.log('Testando API Key:', apiKey.substring(0, 10) + '...')

    const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'LINEAR16',
          // Removendo sampleRateHertz para que a API detecte automaticamente do header WAV
          languageCode: 'pt-BR',
        },
        audio: {
          content: testAudio
        }
      })
    })

    const result = await response.json()
    console.log('Resposta da Google Speech API:', response.status, result)

    if (!response.ok) {
      let errorMessage = 'API Key inválida ou serviço não habilitado'
      let diagnostics = []
      
      if (result.error) {
        console.error('Erro detalhado da Google:', result.error)
        
        switch (result.error.status) {
          case 'INVALID_ARGUMENT':
            errorMessage = 'API Key inválida ou formato incorreto'
            diagnostics.push('Verifique se a API Key está correta')
            break
          case 'PERMISSION_DENIED':
            errorMessage = 'Speech-to-Text API não está habilitada no projeto'
            diagnostics.push('Habilite a Cloud Speech-to-Text API no Google Cloud Console')
            diagnostics.push('Verifique se a API Key tem permissões para Speech-to-Text')
            break
          case 'UNAUTHENTICATED':
            errorMessage = 'API Key inválida ou não autorizada'
            diagnostics.push('Verifique se a API Key foi criada corretamente')
            diagnostics.push('Verifique restrições da API Key (domínios, IPs)')
            break
          default:
            errorMessage = result.error.message || errorMessage
            diagnostics.push('Erro não catalogado: ' + result.error.status)
        }
      } else {
        diagnostics.push('Status HTTP: ' + response.status)
        diagnostics.push('Resposta inesperada da API')
      }

      return NextResponse.json(
        { 
          valid: false, 
          error: errorMessage,
          diagnostics: diagnostics,
          details: result.error,
          httpStatus: response.status
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      valid: true, 
      message: 'API Key válida e Speech-to-Text API habilitada' 
    })
  } catch (error) {
    console.error('Erro ao validar API Key:', error)
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Erro interno do servidor ao validar API Key' 
      },
      { status: 500 }
    )
  }
} 