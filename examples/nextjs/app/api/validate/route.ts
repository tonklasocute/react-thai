// Route Handler using the server-safe zod entry.
import { thaiIdSchema } from 'react-thai/zod';

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = thaiIdSchema.safeParse(params.get('id') ?? '');
  return Response.json({ birthday: params.get('birthday'), idValid: id.success });
}
