import { Application } from "@oak/oak/";
import { bookRouter } from "./book.routes.ts";

const app = new Application();

app.use(bookRouter.routes());
app.use(bookRouter.allowedMethods());

app.listen({ port: 3000 });