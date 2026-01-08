import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function relativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}
