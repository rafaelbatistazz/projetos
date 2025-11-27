import React from 'react';
import YouTube from 'react-youtube';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
    videoId: string;
    className?: string;
    onEnd?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, className, onEnd }) => {
    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0, // Disable fullscreen to prevent YT interface leak
            disablekb: 1, // Disable keyboard shortcuts
            iv_load_policy: 3, // Hide annotations
        },
    };

    return (
        <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg", className)}>
            <YouTube
                videoId={videoId}
                opts={opts}
                className="absolute inset-0 w-full h-full"
                onEnd={onEnd}
            />
            {/* Transparent overlay to prevent clicking on YouTube logo/title if needed. 
          Note: This might block controls if not positioned carefully. 
          We'll position it only over the top area where the title/logo usually is. */}
            <div className="absolute top-0 left-0 w-full h-16 z-10 bg-transparent" />

            {/* Block "Watch on YouTube" button usually at bottom right */}
            {/* <div className="absolute bottom-0 right-0 w-40 h-12 z-10 bg-transparent" /> */}
            {/* Blocking bottom right might block quality settings. Use with caution. */}
        </div>
    );
};

export default VideoPlayer;
