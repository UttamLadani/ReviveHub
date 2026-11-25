// Makes every model send "id" (string) instead of "_id" / "__v" to the frontend.
export default function cleanJson(schema) {
  schema.set('toJSON', {
    transform(_doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    },
  });
}
