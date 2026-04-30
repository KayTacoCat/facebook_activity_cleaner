export const redactText = (value: string, max = 120) => value.replace(/https:\/\/www\.facebook\.com\/[^\s/]+/g, 'https://www.facebook.com/[REDACTED]').slice(0, max);
