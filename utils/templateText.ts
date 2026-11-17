/** Preserve coordinates, rotation and future fields when opening the simple editor. */
export const TEMPLATE_TEXT_COLORS = ['#FFFFFF', '#000000', '#C0C0C0', '#F59E0B', '#EF4444', '#3B82F6'];
export function editableTemplateText(t: string | Record<string, any>, index: number) {
  return {
    ...(typeof t === 'object' ? t : {}),
    id: typeof t === 'object' && t.id ? t.id : `text-${index}`,
    content: typeof t === 'string' ? t : t.content,
    fontFamily: typeof t === 'string' ? 'Bebas Neue' : (t.fontFamily || 'Bebas Neue'),
    size: typeof t === 'string' ? 1 : (t.size ?? 1),
    color: typeof t === 'string' ? '#FFFFFF' : (t.color || '#FFFFFF'),
    yPosition: typeof t === 'string' ? 30 + index * 25 : (t.yPosition ?? 50),
  };
}
