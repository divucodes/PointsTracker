import { pgTable, text, integer, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
    id: integer('id').primaryKey().default(1),
    startDate: timestamp('start_date').notNull().defaultNow(),
});

export const tasks = pgTable('tasks', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    description: text('description'),
    points: integer('points').notNull(),
});

export const users = pgTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const completions = pgTable('completions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id),
    taskId: text('task_id').notNull().references(() => tasks.id),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
}, (table) => {
    return {
        userTaskUnique: uniqueIndex('user_task_unique').on(table.userId, table.taskId),
    };
});
