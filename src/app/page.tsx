'use client';

import { useEffect, useState } from 'react';
import { getSettings, getTasks, registerUser, getUser, completeTask, getUserCompletions, loginByName } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Lock, Trophy, User as UserIcon, Calendar, Check, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Scoreboard from '@/components/Scoreboard';

export default function ParticipantPage() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [s, t] = await Promise.all([getSettings(), getTasks()]);
    setSettings(s);
    setTasks(t);

    const savedUserId = localStorage.getItem('tracker_user_id');
    if (savedUserId) {
      const u = await getUser(savedUserId);
      if (u) {
        setUser(u);
        const c = await getUserCompletions(savedUserId);
        setCompletions(c);
      }
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Try to find if user already exists
      let u = await loginByName(name.trim());

      if (!u) {
        // If not, register new user
        u = await registerUser(name.trim());
        toast.success(`Registered successfully! Good luck, ${name}`);
      } else {
        toast.info(`Welcome back, ${name}!`);
      }

      localStorage.setItem('tracker_user_id', u.id);
      setUser(u);
      const c = await getUserCompletions(u.id);
      setCompletions(c);
    } catch (error) {
      toast.error('Error joining competition');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(taskId: string) {
    if (!user) return;
    try {
      const res = await completeTask(user.id, taskId);
      if (res.success) {
        setCompletions([...completions, taskId]);
        toast.success('Points claimed!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim points');
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 space-y-8">
        <div className="w-full max-w-xl">
          <Scoreboard />
        </div>

        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-600 p-4 rounded-3xl w-fit mb-4 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black">Join Competition</CardTitle>
            <CardDescription>Enter your name to start tracking your tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg py-6 rounded-xl border-2 focus:border-blue-600 transition-all font-medium"
              />
              <Button type="submit" className="w-full py-6 text-xl font-black bg-blue-600 hover:bg-black transition-all shadow-lg rounded-xl">
                START TRACKING
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isLocked = settings && new Date().getTime() > new Date(settings.startDate).getTime() + 7 * 24 * 60 * 60 * 1000;

  // Calculate total points by counting all completions
  const totalPoints = completions.reduce((acc, taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return acc + (task?.points || 0);
  }, 0);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Tracker (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <UserIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
                  <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Active Participant</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-blue-600">{totalPoints}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">My Points</p>
              </div>
            </CardContent>
          </Card>

          {isLocked ? (
            <div className="bg-red-600 p-4 rounded-2xl flex items-center gap-3 text-white shadow-lg animate-pulse">
              <Lock className="w-6 h-6" />
              <p className="font-black uppercase tracking-tight">Week Lock Active - Scoring Closed</p>
            </div>
          ) : (
            <div className="bg-indigo-600 p-4 rounded-2xl flex items-center gap-3 text-white shadow-lg">
              <Calendar className="w-6 h-6" />
              <p className="font-bold">Competition Ends: {format(new Date(new Date(settings.startDate).getTime() + 7 * 24 * 60 * 60 * 1000), 'PPPP')}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 px-1 uppercase tracking-tighter italic">Live Challenges</h3>
            {tasks.map((task) => {
              const claimCount = completions.filter(id => id === task.id).length;
              return (
                <Card key={task.id} className={`border-none shadow-md transition-all ${claimCount > 0 ? 'bg-slate-50' : 'bg-white hover:scale-[1.02]'}`}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${claimCount > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {claimCount > 0 ? <Check className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-blue-600">{task.points} PTS</span>
                          {claimCount > 0 && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              ×{claimCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleComplete(task.id)}
                      disabled={isLocked}
                      className="bg-black hover:bg-blue-600 text-white font-black px-6 py-5 rounded-xl transition-all uppercase tracking-tight"
                    >
                      Claim Points
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right: Scoreboard (5 Cols) */}
        <div className="lg:col-span-5">
          <Scoreboard />
        </div>
      </div>
    </main>
  );
}
