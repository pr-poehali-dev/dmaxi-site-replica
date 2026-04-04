import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function useAuthGuard() {
  const { user } = useAuth();

  const guard = (action: () => void) => {
    if (!user) {
      toast.error("Необходима регистрация", {
        description: "Чтобы воспользоваться сервисом, сначала необходимо пройти регистрацию.",
        duration: 4000,
        action: {
          label: "Войти",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("navigate-to-login"));
          },
        },
      });
      return;
    }
    action();
  };

  return { guard, isAuth: !!user };
}
