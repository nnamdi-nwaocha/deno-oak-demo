import { Router } from "@oak/oak/router";
import type { Book } from "./book.types.ts";
import { createBookSchema, updateBookSchema, validate } from "./validation.ts";

const kv = await Deno.openKv();
const bookRouter = new Router;
bookRouter.prefix('/books');

async function getBookById(id: string) {
    const entry = await kv.get(["books", id]);
    return entry.value as Book | null;
}

bookRouter.get('/:id', async (context) => {
    try {
        const id = context.params.id;
        const book = await getBookById(id);

        if (book) {
            context.response.body = book;
        } else {
            context.response.status = 404;
            context.response.body = { message: "Book not found" };
        }
    } catch (error) {
        console.log(error)
        context.response.status = 500;
        context.response.body = { message: "Failed to retrieve book" };
    }
});
bookRouter.get('/', async (context) => {
    try {
        const entries = kv.list({ prefix: ["books"] });
        const books: Book[] = [];

        for await (const entry of entries) {
            books.push(entry.value as Book);
        }

        context.response.body = books;
    } catch (error) {
        console.log(error)
        context.response.status = 500;
        context.response.body = { message: "Failed to fetch books" };
    }
});
bookRouter.post("/", validate(createBookSchema), async (context) => {
    try {
        const body = await context.request.body.json();

        const uuid = crypto.randomUUID();
        const newBook: Book = { id: uuid, ...body };

        await kv.set(["books", uuid], newBook);

        context.response.status = 201;
        context.response.body = { message: "Book added", book: newBook };
    } catch (error) {
        console.log(error)
        context.response.status = 500;
        context.response.body = { message: "Failed to add book" };
    }
});
bookRouter.patch('/:id', validate(updateBookSchema), async (context) => {
    try {
        const id = context.params.id;
        const existingBook = await getBookById(id);

        if (!existingBook) {
            context.response.status = 404;
            context.response.body = { message: "Book not found" };
            return;
        }

        const body = await context.request.body.json();

        const updatedBook = { ...existingBook, ...body };

        await kv.set(["books", id], updatedBook);
        context.response.status = 200;
        context.response.body = { message: "Book updated", book: updatedBook };
    } catch (error) {
        console.log(error)
        context.response.status = 500;
        context.response.body = { message: "Failed to update book" };
    }
});
bookRouter.delete("/:id", async (context) => {
    try {
        const id = context.params.id;
        const book = await getBookById(id);

        if (!book) {
            context.response.status = 404;
            context.response.body = { message: "Book not found" };
            return;
        }

        await kv.delete(["books", id]);
        context.response.status = 200;
        context.response.body = { message: "Book deleted", book };
    } catch (error) {
        console.log(error)
        context.response.status = 500;
        context.response.body = { message: "Failed to delete book" };
    }
});

export { bookRouter }