export default function DashboardPage() {
  return (
    <div style={{ padding: '50px', backgroundColor: '#e2e8f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'red', fontSize: '40px', fontWeight: 'bold' }}>
        🚨 TES: HALAMAN DASHBOARD MUNCUL!
      </h1>
      <p style={{ color: 'black', marginTop: '10px' }}>
        Jika Anda bisa melihat tulisan ini, berarti masalahnya murni karena Supabase "nyangkut" saat membaca sesi.
      </p>
    </div>
  )
}