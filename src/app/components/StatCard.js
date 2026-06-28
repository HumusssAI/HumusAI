export default function StatCard({ title, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      
      <h2 className="text-green-500 text-xl font-bold mb-2">
        {title}
      </h2>

      <p className="text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}