'use client';

import { useEffect, useState } from 'react';
import {
    getSettings,
    updateStartDate,
    getTasks,
    addTask,
    deleteTask,
    resetCompetition,
    getParticipants,
    adminCompleteTask,
    seedTasks,
    deleteAllTasks
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Plus, Trash2, Settings, ShieldCheck, LogIn, RefreshCcw, Award } from 'lucide-react';
import Scoreboard from '@/components/Scoreboard';
import { toast } from 'sonner';

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [passkey, setPasskey] = useState('');
    const [settingsData, setSettingsData] = useState<any>(null);
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Manual grant state
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedTask, setSelectedTask] = useState('');

    useEffect(() => {
        const auth = localStorage.getItem('is_admin') === 'true';
        setIsAdmin(auth);
        if (auth) loadData();
        else setLoading(false);
    }, []);

    async function loadData() {
        setLoading(true);
        const [s, t, p] = await Promise.all([getSettings(), getTasks(), getParticipants()]);
        setSettingsData(s);
        setAllTasks(t);
        setParticipants(p);
        setLoading(false);
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passkey === 'admin123') {
            localStorage.setItem('is_admin', 'true');
            setIsAdmin(true);
            loadData();
            toast.success('Admin session started');
        } else {
            toast.error('Invalid passkey');
        }
    };

    const handleReset = async () => {
        if (confirm('Are you absolutely sure? This will delete all users and score data!')) {
            await resetCompetition();
            toast.success('Competition has been reset');
            loadData();
        }
    };

    const handleManualGrant = async () => {
        if (!selectedUser || !selectedTask) {
            toast.error('Select both user and task');
            return;
        }
        const res = await adminCompleteTask(selectedUser, selectedTask);
        if (res.success) {
            toast.success('Points granted successfully');
            loadData();
        }
    };

    if (loading) return null;

    if (!isAdmin) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
                <Card className="w-full max-w-md shadow-xl border-none">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-indigo-100 p-3 rounded-full w-fit mb-2">
                            <ShieldCheck className="w-8 h-8 text-indigo-600" />
                        </div>
                        <CardTitle className="text-2xl font-black">Admin Access</CardTitle>
                        <CardDescription>Enter passkey to manage competition</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Admin Passkey"
                                value={passkey}
                                onChange={(e) => setPasskey(e.target.value)}
                            />
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                <LogIn className="w-4 h-4 mr-2" />
                                Unlock Dashboard
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Control Panel</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={async () => { await seedTasks(); loadData(); toast.success('Default tasks added'); }} className="rounded-full">
                        Seed Default Tasks
                    </Button>
                    <Button variant="destructive" onClick={handleReset} className="rounded-full shadow-lg">
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Full Reset
                    </Button>
                    <Button variant="outline" onClick={() => { localStorage.removeItem('is_admin'); setIsAdmin(false); }} className="rounded-full">
                        Log Out
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    {/* Manual Task Assignment */}
                    <Card className="border-none shadow-lg bg-indigo-50/50 border-2 border-indigo-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-900">
                                <Award className="w-5 h-5" />
                                Manual Point Grant
                            </CardTitle>
                            <CardDescription>Override scoring to grant tasks manually to any user.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select onValueChange={setSelectedUser}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select Participant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {participants.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={setSelectedTask}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select Task" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allTasks.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.title} ({t.points} pts)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleManualGrant} className="w-full bg-indigo-600 hover:bg-black font-bold">
                                Assign Points Directly
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-600" />
                                Competition Start Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const d = (e.currentTarget.elements.namedItem('startDate') as HTMLInputElement).value;
                                if (d) { await updateStartDate(new Date(d)); toast.success('Timeline updated'); loadData(); }
                            }} className="flex gap-4">
                                <Input type="date" name="startDate" defaultValue={settingsData ? format(new Date(settingsData.startDate), 'yyyy-MM-dd') : ''} className="flex-1" />
                                <Button type="submit">Update</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <Plus className="w-5 h-5" />
                                Config Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const t = (e.currentTarget.elements.namedItem('title') as HTMLInputElement).value;
                                const p = parseInt((e.currentTarget.elements.namedItem('points') as HTMLInputElement).value);
                                if (t && !isNaN(p)) { await addTask(t, p); toast.success('Added'); (e.target as HTMLFormElement).reset(); loadData(); }
                            }} className="flex gap-2">
                                <Input name="title" placeholder="Task description" className="flex-1" />
                                <Input name="points" type="number" placeholder="Pts" className="w-24" />
                                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">Add Task</Button>
                            </form>

                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-dashed border-slate-300">
                                <span className="text-xs font-bold text-slate-500 uppercase">Danger Zone</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50 text-xs font-bold"
                                    onClick={async () => {
                                        if (confirm('Delete ALL tasks? This will also clear all existing participant scores linked to these tasks.')) {
                                            await deleteAllTasks();
                                            loadData();
                                            toast.success('All tasks deleted');
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Clear All Tasks
                                </Button>
                            </div>

                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Task Name</TableHead>
                                        <TableHead className="w-24 text-center">Score</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allTasks.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">{t.title}</TableCell>
                                            <TableCell className="text-center font-black text-indigo-600">+{t.points}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={async () => { await deleteTask(t.id); loadData(); }}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-5">
                    <Scoreboard />
                </div>
            </div>
        </main>
    );
}
