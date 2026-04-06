type JokeCardProps = {
  joke: string;
};

export function JokeCard({ joke }: JokeCardProps) {
  return (
    <section className="animate-fade-up rounded-[1.75rem] bg-white/76 p-7 text-center shadow-soft backdrop-blur-sm sm:p-9">
      <p className="font-display text-[1.8rem] leading-[1.42] tracking-[-0.015em] text-ink sm:text-[2.05rem] sm:leading-[1.4]">
        {joke}
      </p>
    </section>
  );
}
