import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowRight, Info } from "lucide-react";

interface Props {
    onNext: () => void;
}

export function StepIntroCard({ onNext }: Props) {
    return (
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#20b2aa]" />
                    Systematische GdB-Einstufung
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 text-xs sm:text-sm text-gray-300 leading-relaxed">
                <p>
                    Der Grad der Behinderung ist ein Maß für die körperlichen,
                    geistigen, seelischen und sozialen Auswirkungen einer
                    Funktionsbeeinträchtigung.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl">
                        <p className="font-bold text-[#20b2aa] mb-1">Ab GdB 30</p>

                        <p className="text-gray-400 text-xs">
                            Möglichkeit auf Gleichstellung bezüglich des
                            Kündigungsschutzes im Beruf.
                        </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl">
                        <p className="font-bold text-amber-400 mb-1">Ab GdB 50</p>

                        <p className="text-gray-400 text-xs">
                            Offizieller Status als schwerbehinderter Mensch.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={onNext}
                    className="w-full h-12 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold"
                >
                    Analyse starten
                    <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
    );
}