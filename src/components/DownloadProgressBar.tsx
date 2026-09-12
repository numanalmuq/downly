import React from 'react';
import { GalleryIcon, DownloadIcon, CheckIcon, SpinnerIcon } from './Icons';

export interface DownloadTransferState {
  active: boolean;
  optionUrl: string;
  title: string;
  quality: string;
  format: string;
  mode: 'gallery' | 'download';
  progress: number; // 0 - 100
  loadedBytes: number;
  totalBytes: number | null;
  speed: string; // e.g. "2.4 MB/s"
  status: 'connecting' | 'downloading' | 'processing' | 'completed' | 'error';
  statusText: string;
  errorMessage?: string;
}

interface DownloadProgressBarProps {
  transfer: DownloadTransferState;
  onCancel: () => void;
  onDismiss: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const DownloadProgressBar: React.FC<DownloadProgressBarProps> = ({
  transfer,
  onCancel,
  onDismiss,
}) => {
  if (!transfer.active && transfer.status !== 'completed' && transfer.status !== 'error') {
    return null;
  }

  const isCompleted = transfer.status === 'completed';
  const isError = transfer.status === 'error';
  const isIndeterminate = transfer.totalBytes === null || transfer.status === 'connecting' || transfer.status === 'processing';

  return (
    <div
      id="download-progress-container"
      className={`my-3 p-3.5 border-[2.5px] border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] rounded-[4px] transition-all ${
        isCompleted
          ? 'bg-[#A3E635] text-black'
          : isError
          ? 'bg-[#F87171] text-black'
          : 'bg-[#FFE600] text-black'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b-2 border-black">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-black text-white flex items-center justify-center border border-black shrink-0 font-display font-extrabold text-xs">
            {isCompleted ? (
              <CheckIcon className="w-3.5 h-3.5 text-[#A3E635]" />
            ) : isError ? (
              <span className="text-white font-code">!</span>
            ) : (
              <DownloadIcon className="w-3.5 h-3.5 text-[#FFE600]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-display font-black uppercase tracking-tight text-black">
                {isCompleted
                  ? 'SELESAI // TERSIMPAN'
                  : isError
                  ? 'GAGAL // TRANSFER'
                  : 'MENGUNDUH FILE...'}
              </span>
              <span className="text-[10px] font-code font-bold px-1.5 py-0.2 bg-black text-white border border-black">
                {transfer.quality || transfer.format.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isCompleted || isError ? (
          <button
            type="button"
            id="btn-dismiss-progress"
            onClick={onDismiss}
            className="px-2 py-1 bg-white hover:bg-black hover:text-white border-2 border-black text-[11px] font-display font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
          >
            TUTUP [×]
          </button>
        ) : (
          <button
            type="button"
            id="btn-cancel-transfer"
            onClick={onCancel}
            className="px-2 py-1 bg-white hover:bg-red-500 hover:text-white border-2 border-black text-[11px] font-display font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer text-red-600"
          >
            BATAL [×]
          </button>
        )}
      </div>

      <p className="text-[11px] font-sans font-semibold text-black truncate mb-2">
        {transfer.title}
      </p>

      {/* Neo-Brutalist Hard Bar */}
      <div className="relative w-full h-4 bg-white border-2 border-black overflow-hidden mb-2">
        {isCompleted ? (
          <div className="h-full bg-black w-full" />
        ) : isError ? (
          <div className="h-full bg-red-600 w-full" />
        ) : isIndeterminate ? (
          <div className="h-full w-1/3 bg-black animate-indeterminate" />
        ) : (
          <div
            id="download-progress-bar-fill"
            role="progressbar"
            aria-valuenow={Math.round(transfer.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full bg-black transition-all duration-150"
            style={{ width: `${Math.max(3, Math.min(100, transfer.progress))}%` }}
          />
        )}
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-[10px] font-code font-bold text-black">
        <div className="flex items-center gap-1.5">
          {!isCompleted && !isError && (
            <SpinnerIcon className="w-3 h-3 animate-spin" />
          )}
          <span className="uppercase">{transfer.statusText}</span>
          {transfer.totalBytes !== null && !isCompleted && !isError && (
            <span className="bg-black text-white px-1 py-0.2">
              {Math.round(transfer.progress)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {transfer.loadedBytes > 0 && !isCompleted && (
            <span>
              {formatBytes(transfer.loadedBytes)}
              {transfer.totalBytes ? ` / ${formatBytes(transfer.totalBytes)}` : ''}
            </span>
          )}
          {transfer.speed && !isCompleted && !isError && (
            <span className="bg-black text-[#FFE600] px-1 py-0.2 border border-black">
              {transfer.speed}
            </span>
          )}
        </div>
      </div>

      {/* Error Details */}
      {isError && transfer.errorMessage && (
        <div className="mt-2 p-1.5 bg-white border-2 border-black text-[11px] font-code text-red-600">
          ERR: {transfer.errorMessage}
        </div>
      )}
    </div>
  );
};
