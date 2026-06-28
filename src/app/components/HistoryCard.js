export default function HistoryCard({ temperature, date }) {

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between">

      <span>{temperature}°C</span>

      <span className="text-zinc-400 text-sm">
        {date}
      </span>

    </div>
  );
}