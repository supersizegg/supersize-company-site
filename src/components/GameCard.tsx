import { useCallback, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";

interface GameLink {
  label: string;
  href: string;
}

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  video: string;
  links: GameLink[];
}

export default function GameCard({ title, description, image, video, links }: GameCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePointerEnter = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const card = event.currentTarget;
    const videoElement = card.querySelector("video");
    setIsPlaying(true);
    videoElement?.play().catch(() => undefined);
  }, []);

  const handlePointerLeave = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const card = event.currentTarget;
    const videoElement = card.querySelector("video");
    videoElement?.pause();
    if (videoElement) {
      videoElement.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const handleToggle = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(".game-links a")) {
      return;
    }

    const card = event.currentTarget.closest(".game-card");
    if (!card) return;

    const videoElement = card.querySelector("video");

    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        videoElement?.play().catch(() => undefined);
      } else {
        videoElement?.pause();
        if (videoElement) {
          videoElement.currentTime = 0;
        }
      }
      return next;
    });
  }, []);

  return (
    <div
      className={`game-card${isPlaying ? " is-playing" : ""}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div className="game-media">
        <div
          className={`media-container${isPlaying ? " is-playing" : ""}`}
          tabIndex={0}
          aria-label={`Play ${title} preview`}
          onClick={handleToggle}
        >
          <img src={image} alt={title} className="default-img" />
          <video
            className="hover-play"
            muted
            loop
            playsInline
            preload="metadata"
            poster={image}
          >
            <source src={video} type="video/mp4" />
          </video>
        </div>
      </div>

      <div className="game-overlay">
        <div className="game-overlay-content">
          <h3>{title}</h3>
          <p>{description}</p>
          <div className="game-links">
            {links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
