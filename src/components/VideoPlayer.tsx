import React, { useRef, useState, useEffect } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { cn } from '../lib/utils';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
    videoId: string;
    className?: string;
    onEnd?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, className, onEnd }) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            controls: 0, // Hide native controls
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
        },
    };

    const onReady = (event: any) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
    };

    const onStateChange = (event: any) => {
        setIsPlaying(event.data === 1);
        if (event.data === 0 && onEnd) {
            onEnd();
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && isPlaying) {
                setCurrentTime(playerRef.current.getCurrentTime());
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!playerRef.current) return;
        const time = parseFloat(e.target.value);
        playerRef.current.seekTo(time, true);
        setCurrentTime(time);
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!playerRef.current) return;
        const newVolume = parseInt(e.target.value);
        playerRef.current.setVolume(newVolume);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg group", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <YouTube
                videoId={videoId}
                opts={opts}
                className="absolute inset-0 w-full h-full pointer-events-none"
                onReady={onReady}
                onStateChange={onStateChange}
            />

            {/* Black overlay to hide YouTube branding - only visible when not hovering */}
            <div
                className={cn(
                    "absolute top-0 right-0 w-32 h-20 bg-black z-5 transition-opacity duration-300",
                    showControls ? "opacity-0" : "opacity-100"
                )}
            />

            {/* Click overlay to toggle play */}
            <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={togglePlay}
            />

            {/* Custom Controls */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 py-4 z-20 transition-opacity duration-300",
                showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}>
                {/* Progress Bar */}
                <div className="w-full mb-4 flex items-center group/progress">
                    <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </button>

                        <div className="flex items-center space-x-2 group/volume">
                            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        <span className="text-sm text-gray-300 font-medium">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
