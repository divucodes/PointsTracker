'use client';

import { useState, useEffect } from 'react';
import { getLeaderboard } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Star } from 'lucide-react';

export default function Scoreboard() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        const fetchBoard = async () => {
            const data = await getLeaderboard();
            setLeaderboard(data);
        };
        fetchBoard();
        const interval = setInterval(fetchBoard, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white overflow-hidden">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                    <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">
                    Global Standings
                </CardTitle>
                <p className="text-indigo-300 font-medium">Real-time Score Tracking</p>
            </CardHeader>
            <CardContent>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-white/10">
                            <TableRow className="hover:bg-transparent border-white/10">
                                <TableHead className="text-indigo-200 font-bold w-20 text-center">Rank</TableHead>
                                <TableHead className="text-indigo-200 font-bold">Competitor</TableHead>
                                <TableHead className="text-right text-indigo-200 font-bold">Total Pts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboard.map((user, idx) => (
                                <TableRow key={user.id} className="border-white/5 hover:bg-white/10 transition-colors">
                                    <TableCell className="text-center">
                                        {idx === 0 ? (
                                            <div className="flex justify-center"><Medal className="w-6 h-6 text-yellow-400" /></div>
                                        ) : idx === 1 ? (
                                            <div className="flex justify-center"><Medal className="w-6 h-6 text-slate-300" /></div>
                                        ) : idx === 2 ? (
                                            <div className="flex justify-center"><Medal className="w-6 h-6 text-amber-600" /></div>
                                        ) : (
                                            <span className="font-mono text-slate-400">#{idx + 1}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-bold text-lg flex items-center gap-2">
                                        {user.name}
                                        {idx === 0 && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                                            {user.totalPoints}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {leaderboard.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-12 text-slate-500 font-medium italic">
                                        Waiting for the first score...
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
