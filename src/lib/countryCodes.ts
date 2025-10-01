export interface CountryCode {
  name: string
  dial_code: string
  code: string
  flag: string
}

export const countryCodes: CountryCode[] = [
  { name: 'Perú', dial_code: '+51', code: 'PE', flag: '🇵🇪' },
  { name: 'Argentina', dial_code: '+54', code: 'AR', flag: '🇦🇷' },
  { name: 'Bolivia', dial_code: '+591', code: 'BO', flag: '🇧🇴' },
  { name: 'Brasil', dial_code: '+55', code: 'BR', flag: '🇧🇷' },
  { name: 'Chile', dial_code: '+56', code: 'CL', flag: '🇨🇱' },
  { name: 'Colombia', dial_code: '+57', code: 'CO', flag: '🇨🇴' },
  { name: 'Ecuador', dial_code: '+593', code: 'EC', flag: '🇪🇨' },
  { name: 'España', dial_code: '+34', code: 'ES', flag: '🇪🇸' },
  { name: 'Estados Unidos', dial_code: '+1', code: 'US', flag: '🇺🇸' },
  { name: 'México', dial_code: '+52', code: 'MX', flag: '🇲🇽' },
  { name: 'Paraguay', dial_code: '+595', code: 'PY', flag: '🇵🇾' },
  { name: 'Uruguay', dial_code: '+598', code: 'UY', flag: '🇺🇾' },
  { name: 'Venezuela', dial_code: '+58', code: 'VE', flag: '🇻🇪' }
]

export function formatPhoneNumber(dialCode: string, phoneNumber: string): string {
  // Remover espacios y caracteres especiales
  const cleanNumber = phoneNumber.replace(/\D/g, '')

  // Formato WhatsApp: código sin + y número sin espacios
  return `${dialCode.replace('+', '')}${cleanNumber}@c.us`
}

export function parseWhatsAppNumber(whatsappNumber: string): { dialCode: string; phoneNumber: string } | null {
  // Remover @c.us si existe
  const cleanNumber = whatsappNumber.replace('@c.us', '')

  // Intentar encontrar el código de país
  for (const country of countryCodes) {
    const code = country.dial_code.replace('+', '')
    if (cleanNumber.startsWith(code)) {
      return {
        dialCode: country.dial_code,
        phoneNumber: cleanNumber.substring(code.length)
      }
    }
  }

  return null
}
