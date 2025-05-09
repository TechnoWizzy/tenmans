interface TermData {
    "@odata.context": string
    value: Term[]
}

interface Term {
    Id: string
    Code: string
    Name: string
    StartDate: string
    EndDate: string
}

interface MatchResponse {
    data: MatchData
}

interface UserResponse {
    data: UserData
}

interface MatchData {
    segments: MatchSegment[];
    attributes: MatchAttributes
    metadata: MatchMetadata
}

interface UserData {

}

interface MatchAttributes {
    id: string
}

interface MatchMetadata {
    modeImageUrl: string
    rounds: number
    seasonId: string
    map: string
    mapName: string
    mapImageUrl: string
    mapDetails: {
        imageUrl: string
    }
}

type MatchSegment = TeamSummarySegment | RoundSummarySegment | PlayerRoundSegment | PlayerRoundDamageSegment
    | PlayerSummarySegment | PlayerLoadoutSegment | PlayerRoundKillsSegment

type TeamName = "Red" | "Blue"

type TeamSide = "attacker" | "defender"

type Site = "A" | "B" | "C"

type RoundResult = "Defuse" | "Detonate" | "Elimination"

interface UserData {
    platformUserHandle: string
    platformUserIdentifier: string
}

interface TeamSummarySegment {
    type: "team-summary"
    attributes: {
        teamId: TeamName
    }
    metadata: {
        name: TeamName
        hasWon: boolean
    }
    stats: {
        roundsWon: {
            value: number
        }
        roundsLost: {
            value: number
        }
        score: {
            value: number
        }
        kills: {
            value: number
        }
        deaths: {
            value: number
        }
        assists: {
            value: number
        }
        damage: {
            value: number
        }
    }
}

interface RoundSummarySegment {
    type: "round-summary"
    attributes: {
        round: number
    }
    metadata: {
        plant: {
            platformUserIdentifier: string
            roundTime: number,
            site: Site
        }
        defuse: {
            platformUserIdentifier: string,
            roundTime: number,
            site: Site,
        }
    },
    stats: {
        roundResult: {
            value: RoundResult
        },
        winningTeam: {
            value: TeamName
        },
    },
}

interface PlayerRoundSegment {
    type: "player-round"
    attributes: {
        round: number
        platformUserIdentifier: string
    },
    metadata: {
        teamId: TeamName
        teamSide: TeamSide
        agentKey: string
        agentName: string
        agentColor: string
        agentImageUrl: string
        agentPortraitUrl: string
        platformInfo: UserData
        hasWon: boolean
    },
    stats: {
        score: {
            displayName: "Score"
            value: number
        }
        kills: {
            displayName: "Kills"
            value: number
        }
        deaths: {
            displayName: "Deaths"
            value: number
        }
        kdRatio: {
            displayName: "K/D"
            value: number
        }
        assists: {
            displayName: "Assists"
            value: number
        }
        damage: {
            displayName: "Damage"
            value: number
        }
        loadoutValue: {
            displayName: "Loadout Value"
            value: number
        }
        remainingCredits: {
            displayName: "Remaining Credits"
            value: number
        }
        spentCredits: {
            displayName: "Spent Credits"
            value: number
        }
    }
}

interface PlayerRoundDamageSegment {
    type: "player-round-damage"
    attributes: {
        round: number
        platformUserIdentifier: string
        opponentPlatformUserIdentifier: string
    }
    metadata: {
        platformInfo: UserData
        opponentPlatformInfo: UserData
    }
    stats: {
        damage: {
            value: number
        }
        legshots: {
            value: number
        }
        bodyshots: {
            value: number
        }
        headshots: {
            value: number
        }
    }
}

interface PlayerSummarySegment {
    type: "player-summary"
    attributes: {
        platformUserIdentifier: string
    }
    metadata: {
        teamId: TeamName
        agentKey: string
        agentName: string
        agentColor: string
        agentImageUrl: string
        agentPortraitUrl: string
        countryCode: string
        platformInfo: UserData
        accountLevel: number
    },
    stats: {
        score: {
            displayName: "Score"
            value: number
        }
        placement: {
            displayName: "Placement"
            value: number
        }
        scorePerRound: {
            displayName: "Score per Round"
            value: number
        }
        killsPerRound: {
            displayName: "Kills per Round",
            value: number
        }
        kills: {
            displayName: "Kills"
            value: number
        }
        deaths: {
            displayName: "Deaths"
            value: number
        }
        assists: {
            value: number
        }
        kdRatio: {
            displayName: "K/D"
            value: number
        }
        damage: {
            displayName: "Damage"
            value: number
        }
        damagePerRound: {
            displayName: "Damage per Round"
            value: number
        },
        damageDeltaPerRound: {
            displayName: "Damage Delta per Round"
            value: number
        },
        damageReceived: {
            displayName: "Damage Received"
            value: number
        },
        damageReceivedPerRound: {
            displayName: "Damage Received"
            value: number
        },
        singleKills: {
            displayName: "1ks"
            value: number
        },
        doubleKills: {
            displayName: "2ks"
            value: number
        },
        tripleKills: {
            displayName: "3Ks"
            value: number
        },
        quadraKills: {
            displayName: "4Ks"
            value: number
        },
        pentaKills: {
            displayName: "5Ks"
            value: number
        }
        multiKills: {
            value: number
        }
        grenadeCasts: {
            value: number
        }
        ability1Casts: {
            value: number
        }
        ability2Casts: {
            value: number
        }
        ultimateCasts: {
            value: number
        }
        grenadeCastsPerRound: {
            value: number
        }
        ability1CastsPerRound: {
            value: number
        }
        ability2CastsPerRound: {
            value: number
        }
        ultimateCastsPerRound: {
            value: number
        },
        plants: {
            value: number
        }
        defuses: {
            value: number
        }
        firstKills: {
            value: number
        }
        firstDeaths: {
            value: number
        }
        esr: {
            value: number
        }
        firstKillsPerRound: {
            value: number
        }
        firstDeathsPerRound: {
            value: number
        }
        econRating: {
            value: number
        }
        headshots: {
            value: number
        }
        hsAccuracy: {
            value: number
        }
        survived: {
            value: number
        }
        traded: {
            value: number
        }
        kast: {
            value: number
        }
        clutches: {
            value: number
        }
        clutches1v1: {
            value: number
        }
        clutches1v2: {
            value: number
        }
        clutches1v3: {
            value: number
        }
        clutches1v4: {
            value: number
        }
        clutches1v5: {
            value: number
        }
        clutchesLost: {
            value: number
        }
        clutchesLost1v1: {
            value: number
        }
        clutchesLost1v2: {
            value: number
        }
        clutchesLost1v3: {
            value: number
        }
        clutchesLost1v4: {
            value: number
        }
        clutchesLost1v5: {
            value: number
        }
        roundsWinPct: {
            value: number
        }
        attackKills: {
            value: number
        }
        attackDeaths: {
            value: number
        }
        attackAssists: {
            value: number
        }
        attackScore: {
            value: number
        }
        attackScorePerRound: {
            value: number
        }
        attackKdRatio: {
            value: number
        }
        attackDamage: {
            value: number
        }
        attackDamagePerRound: {
            value: number
        }
        attackDamageDeltaPerRound: {
            value: number
        }
        attackFirstKills: {
            value: number
        }
        attackFirstDeaths: {
            value: number
        }
        attackEsr: {
            value: number
        }
        attackFirstKillsPerRound: {
            value: number
        }
        attackFirstDeathsPerRound: {
            value: number
        }
        attackKast: {
            value: number
        }
        attackRoundsWinPct: {
            value: number
        }
        attackHsAccuracy: {
            value: number
        }
        defenseKills: {
            displayName: "Defense Kills"
            value: number
        }
        defenseDeaths: {
            displayName: "Defense Deaths"
            value: number
        }
        defenseAssists: {
            displayName: "Defense Assists"
            value: number
        }
        defenseScore: {
            displayName: "Defense Score"
            value: number
        }
        defenseScorePerRound: {
            displayName: "Defense Score per round"
            value: number
        }
        defenseKdRatio: {
            value: number
        }
        defenseDamage: {
            value: number
        }
        defenseDamagePerRound: {
            value: number
        }
        defenseDamageDeltaPerRound: {
            value: number
        }
        defenseFirstKills: {
            value: number
        }
        defenseFirstDeaths: {
            value: number
        }
        defenseEsr: {
            value: number
        }
        defenseFirstKillsPerRound: {
            value: number
        }
        defenseFirstDeathsPerRound: {
            value: number
        }
        defenseKast: {
            value: number
        }
        defenseRoundsWinPct: {
            value: number
        }
        defenseHsAccuracy: {
            value: number
        }
    }
}

interface PlayerLoadoutSegment {
    type: "player-loadout"
    attributes: {
        platformUserIdentifier: string
        loadout: string
    }
    metadata: {
        name: string
    }
    stats: {
        kills: {
            displayName: "Kills"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        deaths: {
            displayName: "Deaths"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        kDRatio: {
            displayName: "K/D Ratio"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        assists: {
            displayName: "Assists"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        roundsPlayed: {
            displayName: "Rounds"
            displayCategory: "Game"
            category: "game"
            value: number
        }
        roundsWon: {
            displayName: "Rounds Won"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        roundsLost: {
            displayName: "Rounds Lost"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        roundsWinPct: {
            displayName: "Win %"
            displayCategory: "Game"
            category: "game"
            value: number
        }
        score: {
            displayName: "Score"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        damage: {
            displayName: "damage"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        damageReceived: {
            displayName: "Damaged Received"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        headshots: {
            displayName: "Headshots"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        headshotsPercentage: {
            displayName: "HS%"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        traded: {
            displayName: "Traded"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        survived: {
            displayName: "Survived"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        firstBloods: {
            displayName: "First Bloods"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        firstDeaths: {
            displayName: "First Deaths"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        esr: {
            displayName: "ESR"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        kAST: {
            displayName: "KAST"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        kasted: {
            displayName: "Kasted"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        damagePerRound: {
            displayName: "ADR"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        scorePerRound: {
            displayName: "ACS"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        damageDelta: {
            displayName: "Damage Delta Δ"
            displayCategory: "Combat"
            category: "combat"
            value: number
        }
        damageDeltaPerRound: {
            displayName: "DDΔ/Round"
            displayCategory: "Combat"
            category: "combat"
            description: "Damage Dealt - Damage Received, averaged over Rounds played"
            value: number
        }
    }
}

interface PlayerRoundKillsSegment {
    type: "player-round-kills"
    attributes: {
        round: number
        platformUserIdentifier: string
        opponentPlatformUserIdentifier: string
    }
    metadata: {
        platformInfo: UserData
        opponentPlatformInfo: UserData
        assistants: KillAssistant[]
        finishingDamage: {
            damageType: string
            damageItem: string
            isSecondaryFireMode: boolean
        }
        gameTime: number
        roundTime: number
        weaponImageUrl: string
        weaponName: string
        weaponCategory: string
    }
    stats: {
        damage: {
            value: number
        }
    }
}

type LeaderboardAction = "left" | "right" | "refresh"
type GameAction = "cancel" | "cancel-confirm" | "set-url"
type QueueAction = "join" | "leave" | "refresh"