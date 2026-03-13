

export default function CloudButton() {
  return (
    <button
      onClick={() => window.open('https://cloud.lovable.dev', '_blank')}
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full gradient-brand shadow-glow hover:shadow-glow hover:scale-110 transition-all duration-200"
      title="Cloud Details">
      
      
    </button>);

}