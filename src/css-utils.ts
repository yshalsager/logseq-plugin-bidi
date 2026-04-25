export const css_attr_value = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export const css_identifier_part = (value: string): string => value.replace(/([^a-zA-Z0-9_-])/g, '\\$1')

export const css_rule = (selector: string, declarations: string): string => `${selector} {
${declarations}
}`
