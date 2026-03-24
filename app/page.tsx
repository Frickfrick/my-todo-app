'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface Task {
  id: string;
  title: string;
  status: string;
  user_id: string;
  created_at: string;
}

export default function Home() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const router = useRouter()

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')

  async function fetchTasks() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log("Kein User angemeldet");
    setTasks([]);
    return;
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id) 
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Tasks:", error.message);
  } else {
    setTasks(data);
  }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Fehler beim Abmelden:", error.message)
    } else {
      setTasks([]) 
      router.push('/login')
      router.refresh()
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function addTask(e: React.FormEvent) {
  e.preventDefault()
  if (newTaskTitle.trim() === '') return

  // 1. Zuerst der aktuelle User
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    alert("Bitte logge dich ein, um Aufgaben zu speichern.")
    return
  }

  // 2. Task zusammenfügen mit der user_id
  const { error } = await supabase
    .from('tasks')
    .insert([
      { 
        title: newTaskTitle, 
        status: 'offen',
        user_id: user.id 
      }
    ])

  if (!error) {
    setNewTaskTitle('')
    fetchTasks()
  } else {
    console.error("Fehler beim Hinzufügen:", error.message)
  }
}

  async function toggleStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'offen' ? 'erledigt' : 'offen'
    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', id)
    if (!error) fetchTasks()
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) fetchTasks()
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <main className="max-w-xl mx-auto">

      {/* Logout-Leiste ganz oben */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
        >
          Abmelden
        </button>
      </div>

        {/* Header Bereich */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Task Master
          </h1>
          <p className="text-slate-500">Organisiere deine Aufgaben effizient.</p>
        </div>

        {/* Eingabe Formular */}
        <form onSubmit={addTask} className="flex gap-3 mb-10 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="Was steht heute an?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-grow bg-transparent p-3 outline-none text-slate-700 placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-md"
          >
            Hinzufügen
          </button>
        </form>

        {/* Aufgaben Liste */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                task.status === 'erledigt' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200'
              }`}
            >
              <div 
                className="flex items-center gap-4 cursor-pointer flex-grow"
                onClick={() => toggleStatus(task.id, task.status)}
              >
                {/* Status Icon */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.status === 'erledigt' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-indigo-400'
                }`}>
                  {task.status === 'erledigt' && <span className="text-white text-xs">✓</span>}
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-lg font-medium transition-all ${
                    task.status === 'erledigt' ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}>
                    {task.title}
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`text-[10px] uppercase tracking-wider font-bold w-fit px-2 py-0.5 rounded-full mt-1 ${
                    task.status === 'erledigt' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-2"
                title="Aufgabe löschen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-medium italic">Deine Liste ist leer. Zeit für neue Pläne!</p>
          </div>
        )}
      </main>
    </div>
  )
}