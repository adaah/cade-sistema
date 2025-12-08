import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

<<<<<<< HEAD
// Desregistrar Service Workers antigos que podem estar causando erros
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {
        // Ignorar erros ao desregistrar
      });
    }
  });
}

=======
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
createRoot(document.getElementById("root")!).render(<App />);
