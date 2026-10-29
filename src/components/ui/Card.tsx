import { ReactNode } from "react";
export function Card({children,className=""}:{children:ReactNode;className?:string}){ return <div className={"glass-panel p-4 "+className}>{children}</div>; }