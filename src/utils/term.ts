import {getEnv} from "./utils.ts";

export class TermManager {
    public static currentTerm: Term;
    private static terms: Term[];

    public static getTerm(id: string) {
        const term = this.terms.find(term => term.Id == id);
        if (!term) throw new Error("Term not found");
        return term;
    }

    public static getAllTerms() {
        return this.terms;
    }

    public static async loadTerms() {
        const response = await fetch(`${getEnv("PURDUE_IO_URL")}/Terms`);
        const data: TermData = await response.json();
        const terms = data.value
            .filter(term => term.StartDate != null)
            .sort((a, b) => {
            return new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime();
        })

        for (let i = terms.length - 1; i >= 0; i--) {
            const term = terms[i];

            if (this.currentTerm == null) {
                const start = new Date(term.StartDate);
                if (start.getTime() < Date.now()) {
                    this.currentTerm = term;
                }
            }
        }

        if (this.currentTerm == null) {
            throw new Error("No current term found");
        }

        this.terms = terms;
    }
}