import { useWineContext } from '../hooks/useWineContext';
import { FileStatus } from '../utils/constants';

import { uploadFile } from '../services/api';

function FormPage() {
  const { setFileStatus, setWineList } = useWineContext();
  // const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert('File size exceeds 10MB limit.');
      return;
    }
    setFileStatus(FileStatus.PROCESSING);

    try {
      const result = await uploadFile(file);
      setWineList(result);
      setFileStatus(FileStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setFileStatus(FileStatus.ERROR);
    }
  };

  return (
    <form>
      <div className="flex items-center justify-center w-full place-self-center">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-96 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-lg text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-base text-gray-400">PDF only (MAX. 10MB)</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </form>
  );
}

export default FormPage;
