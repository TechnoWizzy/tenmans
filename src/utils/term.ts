import {getEnv} from "./utils.ts";
import {QueueHandler} from "../queue/queue_handler.ts";
import {generateLeaderboard} from "./leaderboard.ts";

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
            });

        for (let i = terms.length - 1; i >= 0; i--) {
            const term = terms[i];

            const start = new Date(term.StartDate);
            if (start.getTime() < Date.now()) {
                if (this.currentTerm && this.currentTerm.Id != term.Id) {
                    const channel = QueueHandler.getChannel();
                    const [embed] = await generateLeaderboard(1, 0, 10, this.currentTerm.Id);
                    if (!embed) {
                        await channel.send({
                            content: `The ${term.Name} semester has begun!`
                        });
                    } else {
                        await channel.send({
                            content: `<@&822549851530461185> The ${term.Name} semester has begun. Here are the final standings for ${this.currentTerm.Name}!`,
                            embeds: [ embed ]
                        });
                    }
                }
                this.currentTerm = term;
                break;
            }
        }

        if (this.currentTerm == null) {
            throw new Error("No current term found");
        }

        this.terms = terms;
        this.scheduleTermUpdate();
    }

    private static scheduleTermUpdate() {
        const now = new Date();
        const second = 1000;
        const minute = 60 * second;
        const interval = 60 * minute;
        const minutes = now.getMinutes() * minute;
        const seconds = now.getSeconds() * second;
        const delay = interval - minutes - seconds;

        setTimeout(async () => {
            await TermManager.loadTerms();
            setInterval(async () => {
                await TermManager.loadTerms();
            }, interval);
        }, delay)
    }
}