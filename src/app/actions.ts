'use server';

import { db } from '@/db';
import { settings, tasks, users, completions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// --- Settings ---
export async function getSettings() {
    const result = await db.select().from(settings).limit(1);
    if (result.length === 0) {
        // Insert default if not exists
        const inserted = await db.insert(settings).values({ id: 1 }).returning();
        return inserted[0];
    }
    return result[0];
}

export async function updateStartDate(date: Date) {
    await db.update(settings).set({ startDate: date }).where(eq(settings.id, 1));
    revalidatePath('/admin');
    revalidatePath('/');
}

// --- Tasks ---
const DEFAULT_TASKS = [
    { title: "5+ Acc attached to one device", points: 3 },
    { title: "60% ^ One upgrade (Claim Weekly)", points: 5 },
    { title: "Receive positive Google review", points: 5 },
    { title: "Shokz", points: 3 },
    { title: "JBL 120", points: 3 },
    { title: "JBL 320", points: 4 },
    { title: "First positive morning message in group chat", points: 3 },
    { title: "Full set of companions", points: 5 },
    { title: "Headphones (Air pods, Galaxy Buds ETC)", points: 2 },
    { title: "New account with BB and OA", points: 3 },
    { title: "Run morning heartbeat - update board/comms and start heartbeat by 8:45am", points: 3 },
    { title: "100% E-SIM attachment rate (Claim Weekly)", points: 5 },
    { title: "Smart Watches", points: 3 },
    { title: "New Business Fibre/Wireless", points: 5 },
    { title: "Sharing win in middle earth", points: 5 },
    { title: "Karaoke Bundle (Speaker, Partylight, Twin pack microphone)", points: 5 },
    { title: "Surprise Challenge", points: 20 },
    { title: "Trend Micro", points: 3 },
];

export async function seedTasks() {
    const existing = await db.select().from(tasks).limit(1);
    if (existing.length === 0) {
        await db.insert(tasks).values(DEFAULT_TASKS);
        revalidatePath('/admin');
        revalidatePath('/');
    }
}

export async function getTasks() {
    return await db.select().from(tasks);
}

export async function addTask(title: string, points: number, description?: string) {
    await db.insert(tasks).values({ title, points, description });
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteTask(id: string) {
    await db.delete(tasks).where(eq(tasks.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
}

// --- User / Completion ---
export async function registerUser(name: string) {
    const result = await db.insert(users).values({ name }).returning();
    return result[0];
}

export async function getUser(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
}

export async function loginByName(name: string) {
    const result = await db.select().from(users).where(eq(users.name, name)).limit(1);
    return result[0];
}

export async function getParticipants() {
    return await db.select().from(users);
}

export async function completeTask(userId: string, taskId: string) {
    const s = await getSettings();
    const now = new Date();
    const weekLocked = now.getTime() > s.startDate.getTime() + 7 * 24 * 60 * 60 * 1000;

    if (weekLocked) {
        throw new Error('Competition has ended. Scores are locked.');
    }

    try {
        await db.insert(completions).values({ userId, taskId });
    } catch (e) {
        // Already completed
        return { success: false, message: 'Task already completed' };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
}

export async function adminCompleteTask(userId: string, taskId: string) {
    try {
        await db.insert(completions).values({ userId, taskId });
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        return { success: false, message: 'Already assigned' };
    }
}

export async function getUserCompletions(userId: string) {
    const results = await db.select().from(completions).where(eq(completions.userId, userId));
    return results.map(r => r.taskId);
}

export async function getLeaderboard() {
    const results = await db
        .select({
            id: users.id,
            name: users.name,
            totalPoints: sql<number>`CAST(COALESCE(SUM(${tasks.points}), 0) AS INTEGER)`,
        })
        .from(users)
        .leftJoin(completions, eq(users.id, completions.userId))
        .leftJoin(tasks, eq(completions.taskId, tasks.id))
        .groupBy(users.id, users.name)
        .orderBy(sql`3 DESC`); // Order by the 3rd column (totalPoints)

    return results;
}

export async function deleteAllTasks() {
    await db.delete(completions); // Delete completions first to maintain integrity
    await db.delete(tasks);
    revalidatePath('/admin');
    revalidatePath('/');
}

// --- Competition Management ---
export async function resetCompetition() {
    // Delete completions first due to FK constraints if any, then users
    await db.delete(completions);
    await db.delete(users);

    // Reset start date to now
    await db.update(settings).set({ startDate: new Date() }).where(eq(settings.id, 1));

    revalidatePath('/');
    revalidatePath('/admin');
}
