import { isOpenSignup } from "@/lib/signup-mode";
import InviteOnlyNotice from "./InviteOnlyNotice";
import SignUpForm from "./SignUpForm";

export default function SignupPage() {
  return isOpenSignup ? <SignUpForm /> : <InviteOnlyNotice />;
}
