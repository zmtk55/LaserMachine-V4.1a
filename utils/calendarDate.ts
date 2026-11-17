/** A delivery date is local wall-calendar data, not a UTC timestamp. */
export function localCalendarDate(value:string):Date {
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
 return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):new Date(value);
}
export function localDateKey(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
