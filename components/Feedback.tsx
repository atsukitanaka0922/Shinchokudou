import { useEffect } from "react";
import { useFeedbackStore } from "@/store/feedbackStore";
import { motion } from "framer-motion";

export default function Feedback() {
  const { message, setMessage } = useFeedbackStore();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
    >
      {message}
    </motion.div>
  );
}
