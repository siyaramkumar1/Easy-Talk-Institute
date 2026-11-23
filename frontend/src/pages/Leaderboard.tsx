import React, { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import axios from 'axios';

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for now, would fetch from /api/users/leaderboard
    setUsers([
      { _id: '1', name: 'Rahul Sharma', xp: 4500, testsCompleted: 15, rank: 1 },
      { _id: '2', name: 'Priya Patel', xp: 4200, testsCompleted: 14, rank: 2 },
      { _id: '3', name: 'Amit Kumar', xp: 3900, testsCompleted: 12, rank: 3 },
      { _id: '4', name: 'Sneha Gupta', xp: 3100, testsCompleted: 10, rank: 4 },
      { _id: '5', name: 'Vikram Singh', xp: 2800, testsCompleted: 8, rank: 5 },
    ]);
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Top 50 Students</h1>
          <p className="text-slate-600">Compete with others and earn XP to climb the leaderboard.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-600">Rank</th>
                <th className="p-4 font-bold text-slate-600">Name</th>
                <th className="p-4 font-bold text-slate-600">XP</th>
                <th className="p-4 font-bold text-slate-600">Tests</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    {u.rank === 1 && <Medal className="w-6 h-6 text-yellow-500" />}
                    {u.rank === 2 && <Medal className="w-6 h-6 text-slate-400" />}
                    {u.rank === 3 && <Medal className="w-6 h-6 text-orange-500" />}
                    {u.rank > 3 && <span className="font-bold text-slate-500 w-6 text-center inline-block">{u.rank}</span>}
                  </td>
                  <td className="p-4 font-bold text-slate-800">{u.name}</td>
                  <td className="p-4 text-blue-600 font-bold">{u.xp} XP</td>
                  <td className="p-4 text-slate-600">{u.testsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
