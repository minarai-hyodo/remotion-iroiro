import { redirect } from "react-router";
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = () => {
  return redirect("/");
};

export default function CatchAll() {
  return null;
}
