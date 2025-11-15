import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wlbzkaegjotckawwjtxv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYnprYWVnam90Y2thd3dqdHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzY1NzAsImV4cCI6MjA3ODgxMjU3MH0.DgeJCyoiMfRyZ96LVffKpiEuBiCyqEQGwhzm3GcTRak'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)