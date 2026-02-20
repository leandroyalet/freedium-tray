import MirrorInput from "./MirrorInput";

interface SetupModalProps {
  onComplete?: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ onComplete }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="bg-blue-600 text-white p-4 -mx-6 -mt-6 rounded-t-lg mb-6">
          <h2 className="text-lg font-semibold">Welcome! Setup Required</h2>
          <p className="mt-1">
            Please configure the Freedium mirror URL to continue.
          </p>
        </div>
        <MirrorInput onSave={onComplete} />
      </div>
    </div>
  );
};

export default SetupModal;
