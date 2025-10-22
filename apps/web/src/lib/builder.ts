import { builder } from '@builder.io/sdk';
const key = process.env.NEXT_PUBLIC_BUILDER_API_KEY;
if (key) {
  builder.init(key);
}

export { builder };