interface TermData {
    "@odata.context": string;
    value: Term[];
}

interface Term {
    Id: string;
    Code: string;
    Name: string;
    StartDate: string;
    EndDate: string;
}

interface MatchResponse {
    data: MatchData;
}

interface ProfileResponse {
    data: ProfileData;
}

interface MatchData {
    segments: MatchSegment[];
    attributes: MatchAttributes;
    metadata: MatchMetadata;
}

interface PlatformInfo {
    platformSlug: string;
    platformUserId: string;
    platformUserHandle: string;
    platformUserIdentifier: string;
    avatarUrl: string;
    additionalParameters: null;
}

interface ProfileData {
    platformInfo: PlatformInfo
    "userInfo": {
        "userId": 7323471,
        "isPremium": false,
        "isVerified": false,
        "isInfluencer": false,
        "isPartner": false,
        "countryCode": "US",
        "customAvatarUrl": null,
        "customHeroUrl": null,
        "customAvatarFrame": null,
        "customAvatarFrameInfo": null,
        "premiumDuration": null,
        "socialAccounts": [],
        "badges": [
            {
                "titleSlug": "valorant",
                "userId": 7323471,
                "key": "xp-tier",
                "lootKey": null,
                "tier": 3,
                "name": "Hero",
                "description": "Climbed to the Hero XP division.",
                "isGlobal": false,
                "isStatTracker": false,
                "badgeImageUrl": "https://trackercdn.com/cdn/awards/badges/badge_xp-tier3.png",
                "awardImageUrl": "https://trackercdn.com/cdn/awards/award_xp-tier3.png",
                "rarity": "Rare",
                "category": "XP",
                "nextMilestone": "Legend Tier",
                "dateAwarded": "2024-12-02T05:01:24.579531+00:00",
                "awarderId": null,
                "seen": true
            },
            {
                "titleSlug": "valorant",
                "userId": 7323471,
                "key": "xp-streak",
                "lootKey": null,
                "tier": 1,
                "name": "Streak I",
                "description": "Maintained an XP streak for 7 days.",
                "isGlobal": false,
                "isStatTracker": false,
                "badgeImageUrl": "https://trackercdn.com/cdn/awards/badges/badge_xp-streak-bronze.png",
                "awardImageUrl": "https://trackercdn.com/cdn/awards/award_xp-streak-bronze.png",
                "rarity": "Rare",
                "category": "XP",
                "nextMilestone": "30 days",
                "dateAwarded": "2025-02-17T23:01:43.849696+00:00",
                "awarderId": null,
                "seen": false
            }
        ],
        "pageviews": 1450,
        "xpTier": 3,
        "isSuspicious": null
    },
    "metadata": {
        "activeShard": "na",
        "schema": "statsv2",
        "privacy": "public",
        "defaultPlatform": "pc",
        "defaultPlaylist": "competitive",
        "defaultSeason": "16118998-4705-5813-86dd-0292a2439d90",
        "premierRosterId": "3cf1874b-f40f-443b-9720-a4158930803c",
        "premierCrests": [
            {
                "rosterId": "3cf1874b-f40f-443b-9720-a4158930803c",
                "seasonId": "d4a2a4e1-4192-7b86-49fd-64a34696ab8a",
                "division": 6,
                "points": 100,
                "crest": "NONE"
            },
            {
                "rosterId": "3cf1874b-f40f-443b-9720-a4158930803c",
                "seasonId": "f0efd645-44a6-f155-5f87-819f25fdbd36",
                "division": 20,
                "points": 100,
                "crest": "NONE"
            }
        ],
        "accountLevel": 190,
        "seasons": [
            {
                "id": "16118998-4705-5813-86dd-0292a2439d90",
                "name": "Season 25 Act 2",
                "shortName": "E25: A2",
                "episodeName": "Season 25",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "476b0893-4c2e-abd6-c5fe-708facff0772",
                "name": "Season 25 Act 1",
                "shortName": "E25: A1",
                "episodeName": "Season 25",
                "actName": "Act 1",
                "playlists": null
            },
            {
                "id": "dcde7346-4085-de4f-c463-2489ed47983b",
                "name": "Episode 9 Act 3",
                "shortName": "E9: A3",
                "episodeName": "Episode 9",
                "actName": "Act 3",
                "playlists": null
            },
            {
                "id": "292f58db-4c17-89a7-b1c0-ba988f0e9d98",
                "name": "Episode 9 Act 2",
                "shortName": "E9: A2",
                "episodeName": "Episode 9",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "52ca6698-41c1-e7de-4008-8994d2221209",
                "name": "Episode 9 Act 1",
                "shortName": "E9: A1",
                "episodeName": "Episode 9",
                "actName": "Act 1",
                "playlists": null
            },
            {
                "id": "4539cac3-47ae-90e5-3d01-b3812ca3274e",
                "name": "Episode 8 Act 3",
                "shortName": "E8: A3",
                "episodeName": "Episode 8",
                "actName": "Act 3",
                "playlists": null
            },
            {
                "id": "22d10d66-4d2a-a340-6c54-408c7bd53807",
                "name": "Episode 8 Act 2",
                "shortName": "E8: A2",
                "episodeName": "Episode 8",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "ec876e6c-43e8-fa63-ffc1-2e8d4db25525",
                "name": "Episode 8 Act 1",
                "shortName": "E8: A1",
                "episodeName": "Episode 8",
                "actName": "Act 1",
                "playlists": null
            },
            {
                "id": "4401f9fd-4170-2e4c-4bc3-f3b4d7d150d1",
                "name": "Episode 7 Act 3",
                "shortName": "E7: A3",
                "episodeName": "Episode 7",
                "actName": "Act 3",
                "playlists": null
            },
            {
                "id": "03dfd004-45d4-ebfd-ab0a-948ce780dac4",
                "name": "Episode 7 Act 2",
                "shortName": "E7: A2",
                "episodeName": "Episode 7",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "0981a882-4e7d-371a-70c4-c3b4f46c504a",
                "name": "Episode 7 Act 1",
                "shortName": "E7: A1",
                "episodeName": "Episode 7",
                "actName": "Act 1",
                "playlists": null
            },
            {
                "id": "2de5423b-4aad-02ad-8d9b-c0a931958861",
                "name": "Episode 6 Act 3",
                "shortName": "E6: A3",
                "episodeName": "Episode 6",
                "actName": "Act 3",
                "playlists": null
            },
            {
                "id": "34093c29-4306-43de-452f-3f944bde22be",
                "name": "Episode 6 Act 2",
                "shortName": "E6: A2",
                "episodeName": "Episode 6",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "9c91a445-4f78-1baa-a3ea-8f8aadf4914d",
                "name": "Episode 6 Act 1",
                "shortName": "E6: A1",
                "episodeName": "Episode 6",
                "actName": "Act 1",
                "playlists": null
            },
            {
                "id": "aca29595-40e4-01f5-3f35-b1b3d304c96e",
                "name": "Episode 5 Act 3",
                "shortName": "E5: A3",
                "episodeName": "Episode 5",
                "actName": "Act 3",
                "playlists": null
            },
            {
                "id": "7a85de9a-4032-61a9-61d8-f4aa2b4a84b6",
                "name": "Episode 5 Act 2",
                "shortName": "E5: A2",
                "episodeName": "Episode 5",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "67e373c7-48f7-b422-641b-079ace30b427",
                "name": "Episode 5 Act 1",
                "shortName": "E5: A1",
                "episodeName": "Episode 5",
                "actName": "Act 1",
                "playlists": null
            },
            {
                "id": "3e47230a-463c-a301-eb7d-67bb60357d4f",
                "name": "Episode 4 Act 3",
                "shortName": "E4: A3",
                "episodeName": "Episode 4",
                "actName": "Act 3",
                "playlists": null
            },
            {
                "id": "d929bc38-4ab6-7da4-94f0-ee84f8ac141e",
                "name": "Episode 4 Act 2",
                "shortName": "E4: A2",
                "episodeName": "Episode 4",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "573f53ac-41a5-3a7d-d9ce-d6a6298e5704",
                "name": "Episode 4 Act 1",
                "shortName": "E4: A1",
                "episodeName": "Episode 4",
                "actName": "Act 1",
                "playlists": null
            },
            {
                "id": "a16955a5-4ad0-f761-5e9e-389df1c892fb",
                "name": "Episode 3 Act 3",
                "shortName": "E3: A3",
                "episodeName": "Episode 3",
                "actName": "Act 3",
                "playlists": null
            },
            {
                "id": "4cb622e1-4244-6da3-7276-8daaf1c01be2",
                "name": "Episode 3 Act 2",
                "shortName": "E3: A2",
                "episodeName": "Episode 3",
                "actName": "Act 2",
                "playlists": null
            },
            {
                "id": "2a27e5d2-4d30-c9e2-b15a-93b8909a442c",
                "name": "Episode 3 Act 1",
                "shortName": "E3: A1",
                "episodeName": "Episode 3",
                "actName": "Act 1",
                "playlists": null
            }
        ],
        "playlists": [
            {
                "id": "competitive",
                "name": "Competitive",
                "platform": "pc"
            },
            {
                "id": "premier",
                "name": "Premier",
                "platform": "pc"
            },
            {
                "id": "unrated",
                "name": "Unrated",
                "platform": "pc"
            },
            {
                "id": "team-deathmatch",
                "name": "Team Deathmatch",
                "platform": "pc"
            },
            {
                "id": "deathmatch",
                "name": "Deathmatch",
                "platform": "pc"
            },
            {
                "id": "spikerush",
                "name": "Spike Rush",
                "platform": "pc"
            },
            {
                "id": "swiftplay",
                "name": "Swiftplay",
                "platform": "pc"
            },
            {
                "id": "escalation",
                "name": "Escalation",
                "platform": "pc"
            },
            {
                "id": "replication",
                "name": "Replication",
                "platform": "pc"
            },
            {
                "id": "newmap-swiftplay",
                "name": "New Map (Swiftplay)",
                "platform": "pc"
            },
            {
                "id": "newmap-bomb",
                "name": "New Map (Bomb)",
                "platform": "pc"
            }
        ]
    },
    segments: PlayerSegment[];
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

type PlayerSegment = PeakRatingSegment | SeasonSegment | AgentSegment | AgentRoleSegment | AgentTopMapSegment;

type MatchSegment = TeamSummarySegment | RoundSummarySegment | PlayerRoundSegment | PlayerRoundDamageSegment
    | PlayerSummarySegment | PlayerLoadoutSegment | PlayerRoundKillsSegment;

type TeamName = "Red" | "Blue";

type TeamSide = "attacker" | "defender";

type Site = "A" | "B" | "C";

type RoundResult = "Defuse" | "Detonate" | "Elimination";

interface AbilityData {
    name: string;
    imageUrl: string;
}

interface SeasonSegment {
    type: "season",
    attributes: {
        seasonId: string,
        playlist: string
    },
    metadata: {
        name: string,
        shortName: string,
        playlistName: string,
        startTime: string,
        endTime: string,
        schema: string
    },
    stats: {
        matchesPlayed: {
            displayName: "Matches Played";
            value: number;
            displayValue: string;
        };
        matchesWon: {
            percentile: number;
            displayName: "Wins";
            value: number;
            displayValue: string;
        };
        matchesLost: {
            displayName: "Losses";
            value: number;
            displayValue: string;
        };
        matchesTied: {
            displayName: "Ties";
            value: number;
            displayValue: string;
        };
        matchesWinPct: {
            percentile: number;
            displayName: "Win %";
            value: number;
            displayValue: string;
        };
        matchesDisconnected: {
            displayName: "Disconnects";
            value: number;
            displayValue: string;
        };
        matchesDuration: {
            displayName: "Matches Duration";
            value: number;
            displayValue: string;
        };
        timePlayed: {
            displayName: "Time Played";
            value: number;
            displayValue: string;
        };
        mVPs: {
            displayName: "MVPs";
            value: number;
            displayValue: string;
        };
        roundsPlayed: {
            displayName: "Rounds Played";
            value: number;
            displayValue: string;
        };
        roundsWon: {
            displayName: "Rounds Won";
            value: number;
            displayValue: string;
        };
        roundsLost: {
            displayName: "Rounds Lost";
            value: number;
            displayValue: string;
        };
        roundsWinPct: {
            percentile: number;
            displayName: "Round Win %";
            value: number;
            displayValue: string;
        };
        roundsDuration: {
            displayName: "Rounds Duration";
            value: number;
            displayValue: string;
        };
        score: {
            displayName: "Score";
            value: number;
            displayValue: string;
        };
        scorePerMatch: {
            displayName: "Score/Match";
            value: number;
            displayValue: string;
        };
        scorePerRound: {
            percentile: number;
            displayName: "ACS";
            value: number;
            displayValue: string;
        };
        kills: {
            percentile: number;
            displayName: "Kills";
            value: number;
            displayValue: string;
        };
        killsPerRound: {
            displayName: "Kills/Round";
            value: number;
            displayValue: string;
        };
        killsPerMatch: {
            displayName: "Kills/Match";
            value: number;
            displayValue: string;
        };
        deaths: {
            displayName: "Deaths";
            value: number;
            displayValue: string;
        };
        deathsPerRound: {
            displayName: "Deaths/Round";
            value: number;
            displayValue: string;
        };
        deathsPerMatch: {
            displayName: "Deaths/Match";
            value: number;
            displayValue: string;
        };
        assists: {
            displayName: "Assists";
            value: number;
            displayValue: string;
        };
        assistsPerRound: {
            displayName: "Assists/Round";
            value: number;
            displayValue: string;
        };
        assistsPerMatch: {
            displayName: "Assists/Match";
            value: number;
            displayValue: string;
        };
        kDRatio: {
            percentile: number;
            displayName: "K/D Ratio";
            value: number;
            displayValue: string;
        };
        kDARatio: {
            displayName: "KDA Ratio";
            value: number;
            displayValue: string;
        };
        kADRatio: {
            displayName: "KAD Ratio";
            value: number;
            displayValue: string;
        };
        damage: {
            displayName: "Damage";
            value: number;
            displayValue: string;
        };
        damageDelta: {
            percentile: number;
            displayName: "Damage Delta Δ";
            value: number;
            displayValue: string;
            displayType: "Number";
        };
        damageDeltaPerRound: {
            percentile: number;
            displayName: "DDΔ/Round";
            description: string;
            value: number;
            displayValue: string;
        };
        damagePerRound: {
            percentile: number;
            displayName: "Damage/Round";
            value: number;
            displayValue: string;
        };
        damagePerMatch: {
            displayName: "Damage/Match";
            value: number;
            displayValue: string;
        };
        damagePerMinute: {
            displayName: "Damage/Minute";
            value: number;
            displayValue: string;
        };
        damageReceived: {
            displayName: "Damage Received";
            value: number;
            displayValue: string;
        };
        headshots: {
            displayName: "Headshots";
            value: number;
            displayValue: string;
        };
        headshotsPerRound: {
            displayName: "Headshots/Round";
            value: number;
            displayValue: string;
        };
        headshotsPercentage: {
            percentile: number;
            displayName: "Headshot %";
            value: number;
            displayValue: string;
        };
        grenadeCasts: {
            displayName: "Grenade Casts";
            value: number;
            displayValue: string;
        };
        grenadeCastsPerRound: {
            displayName: "Grenade Casts / Round";
            value: number;
            displayValue: string;
        };
        grenadeCastsPerMatch: {
            displayName: "Grenade Casts / Match";
            value: number;
            displayValue: string;
        };
        ability1Casts: {
            displayName: "Ability 1 Casts";
            value: number;
            displayValue: string;
        };
        ability1CastsPerRound: {
            displayName: "Ability 1 Casts / Round";
            value: number;
            displayValue: string;
        };
        ability1CastsPerMatch: {
            displayName: "Ability 1 Casts / Match";
            value: number;
            displayValue: string;
        };
        ability2Casts: {
            displayName: "Ability 2 Casts";
            value: number;
            displayValue: string;
        };
        ability2CastsPerRound: {
            displayName: "Ability 2 Casts / Round";
            value: number;
            displayValue: string;
        };
        ability2CastsPerMatch: {
            displayName: "Ability 2 Casts / Match";
            value: number;
            displayValue: string;
        };
        ultimateCasts: {
            displayName: "Ultimate Casts";
            value: number;
            displayValue: string;
        };
        ultimateCastsPerRound: {
            displayName: "Ultimate Casts / Round";
            value: number;
            displayValue: string;
        };
        ultimateCastsPerMatch: {
            displayName: "Ultimate Casts / Match";
            value: number;
            displayValue: string;
        };
        dealtHeadshots: {
            displayName: "Dealt Headshots";
            value: number;
            displayValue: string;
        };
        dealtBodyshots: {
            displayName: "Dealt Bodyshots";
            value: number;
            displayValue: string;
        };
        dealtLegshots: {
            displayName: "Dealt Legshots";
            value: number;
            displayValue: string;
        };
        receivedHeadshots: {
            displayName: "Received Headshots";
            value: number;
            displayValue: string;
        };
        receivedBodyshots: {
            displayName: "Received Bodyshots";
            value: number;
            displayValue: string;
        };
        receivedLegshots: {
            displayName: "Received Legshots";
            value: number;
            displayValue: string;
        };
        econRating: {
            displayName: "Econ Rating";
            value: number;
            displayValue: string;
        };
        econRatingPerMatch: {
            displayName: "Econ Rating / Match";
            value: number;
            displayValue: string;
        };
        econRatingPerRound: {
            displayName: "Econ Rating / Round";
            value: number;
            displayValue: string;
        };
        suicides: {
            displayName: "Suicides";
            value: number;
            displayValue: string;
        };
        firstBloods: {
            displayName: "First Bloods";
            value: number;
            displayValue: string;
        };
        firstBloodsPerRound: {
            displayName: "First Bloods / Round";
            value: number;
            displayValue: string;
        };
        firstBloodsPerMatch: {
            displayName: "First Bloods / Match";
            value: number;
            displayValue: string;
        };
        firstDeaths: {
            displayName: "First Deaths";
            value: number;
            displayValue: string;
        };
        firstDeathsPerRound: {
            displayName: "First Deaths / Round";
            value: number;
            displayValue: string;
        };
        lastDeaths: {
            displayName: "Last Deaths";
            value: number;
            displayValue: string;
        };
        survived: {
            displayName: "Rounds Survived";
            value: number;
            displayValue: string;
        };
        traded: {
            displayName: "Rounds Traded";
            value: number;
            displayValue: string;
        };
        kAST: {
            percentile: number;
            displayName: "KAST";
            description: string;
            value: number;
            displayValue: string;
        };
        mostKillsInMatch: {
            displayName: "Most Kills (Match)";
            value: number;
            displayValue: string;
        };
        flawless: {
            displayName: "Flawless Rounds";
            value: number;
            displayValue: string;
        };
        thrifty: { displayName: "Thrifty Rounds"; value: number; displayValue: string; };
        aces: { displayName: "Aces"; value: number; displayValue: string; };
        teamAces: { displayName: "Team Aces"; value: number; displayValue: string; };
        clutches: { displayName: "Clutches"; value: number; displayValue: string; };
        clutchesPercentage: { displayName: "Clutch %"; value: number; displayValue: string; };
        clutchesLost: { displayName: "Clutches Lost"; value: number; displayValue: string; };
        clutches1v1: { displayName: "Clutches (1v1)"; value: number; displayValue: string };
        clutches1v2: { displayName: "Clutches (1v2)"; value: number; displayValue: string };
        clutches1v3: { displayName: "Clutches (1v3)"; value: number; displayValue: string };
        clutches1v4: { displayName: "Clutches (1v4)"; value: number; displayValue: string };
        clutches1v5: { displayName: "Clutches (1v5)"; value: number; displayValue: string };
        clutchesLost1v1: { displayName: "Clutches Lost (1v1)"; value: number; displayValue: string };
        clutchesLost1v2: { displayName: "Clutches Lost (1v2)"; value: number; displayValue: string };
        clutchesLost1v3: { displayName: "Clutches Lost (1v3)"; value: number; displayValue: string };
        clutchesLost1v4: { displayName: "Clutches Lost (1v4)"; value: number; displayValue: string };
        clutchesLost1v5: { displayName: "Clutches Lost (1v5)"; value: number; displayValue: string };
        kills1K: { displayName: "Multikills (1K)"; value: number; displayValue: string };
        kills2K: { displayName: "Multikills (2K)"; value: number; displayValue: string };
        kills3K: { displayName: "Multikills (3K)"; value: number; displayValue: string };
        kills4K: { displayName: "Multikills (4K)"; value: number; displayValue: string; displayType?: "Number" };
        kills5K: { displayName: "Multikills (5K)"; value: number; displayValue: string };
        kills6K: { displayName: "Multikills (6K)"; value: number; displayValue: string };
        esr: { displayName: "ESR"; value: number; displayValue: string };
        plants: { displayName: "Plants"; value: number; displayValue: string };
        plantsPerMatch: { displayName: "Plants/Match"; value: number; displayValue: string };
        plantsPerRound: { displayName: "Plants/Round"; value: number; displayValue: string };
        attackKills: { displayName: "Kills"; value: number; displayValue: string };
        attackKillsPerRound: { displayName: "Kills / Round"; value: number; displayValue: string };
        attackDeaths: { displayName: "Deaths / Round"; value: number; displayValue: string };
        attackKDRatio: { displayName: "K/D Ratio"; value: number; displayValue: string };
        attackAssists: { displayName: "Assists"; value: number; displayValue: string };
        attackAssistsPerRound: { displayName: "Assists / Round"; value: number; displayValue: string };
        attackRoundsWon: { displayName: "Rounds Won"; value: number; displayValue: string };
        attackRoundsLost: { displayName: "Rounds Lost"; value: number; displayValue: string };
        attackRoundsPlayed: { displayName: "Rounds Played"; value: number; displayValue: string };
        attackRoundsWinPct: { displayName: "Round Win %"; value: number; displayValue: string };
        attackScore: { displayName: "Score"; value: number; displayValue: string };
        attackScorePerRound: { displayName: "ACS"; value: number; displayValue: string };
        attackDamage: { displayName: "Damage"; value: number; displayValue: string };
        attackDamageReceived: { displayName: "Damage Received"; value: number; displayValue: string };
        attackDamagePerRound: { displayName: "Damage/Round"; value: number; displayValue: string };
        attackDamageDelta: { displayName: "Damage Delta Δ"; value: number; displayValue: string };
        attackDamageDeltaPerRound: { displayName: "DDΔ/Round"; displayCategory: "Attack"; value: number; displayValue: string };
        attackHeadshots: { displayName: "Headshots"; value: number; displayValue: string };
        attackTraded: { displayName: "Rounds Traded"; value: number; displayValue: string };
        attackSurvived: { displayName: "Rounds Survived"; value: number; displayValue: string };
        attackFirstBloods: { displayName: "First Bloods"; value: number; displayValue: string };
        attackFirstBloodsPerRound: { displayName: "First Bloods / Round"; value: number; displayValue: string };
        attackFirstDeaths: { displayName: "First Deaths"; value: number; displayValue: string };
        attackFirstDeathsPerRound: { displayName: "First Deaths / Round"; value: number; displayValue: string };
        attackEsr: { displayName: "ESR"; value: number; displayValue: string };
        attackKAST: { displayName: "KAST"; value: number; displayValue: string };
        defuses: { displayName: "Defuses"; value: number; displayValue: string };
        defusesPerMatch: { displayName: "Defuses/Match"; value: number; displayValue: string };
        defusesPerRound: { displayName: "Defuses/Round"; value: number; displayValue: string };
        defenseKills: { displayName: "Kills"; value: number; displayValue: string };
        defenseKillsPerRound: { displayName: "Kills/Round"; value: number; displayValue: string };
        defenseDeaths: { displayName: "Deaths"; value: number; displayValue: string };
        defenseKDRatio: { displayName: "K/D Ratio"; value: number; displayValue: string };
        defenseAssists: { displayName: "Assists"; value: number; displayValue: string };
        defenseAssistsPerRound: { displayName: "Assists/Round"; value: number; displayValue: string };
        defenseRoundsWon: { displayName: "Rounds Won"; value: number; displayValue: string };
        defenseRoundsLost: { displayName: "Rounds Lost"; value: number; displayValue: string };
        defenseRoundsPlayed: { displayName: "Rounds Played"; value: number; displayValue: string };
        defenseRoundsWinPct: { displayName: "Round Win %"; value: number; displayValue: string };
        defenseScore: { displayName: "Score"; value: number; displayValue: string };
        defenseScorePerRound: { displayName: "ACS"; value: number; displayValue: string };
        defenseDamage: { displayName: "Damage"; value: number; displayValue: string };
        defenseDamageReceived: { displayName: "Damage Received"; value: number; displayValue: string };
        defenseDamagePerRound: { displayName: "Damage/Round"; value: number; displayValue: string };
        defenseDamageDelta: { displayName: "Damage Delta Δ"; value: number; displayValue: string };
        defenseDamageDeltaPerRound: { displayName: "DDΔ/Round"; description: string; value: number; displayValue: string };
        defenseHeadshots: { displayName: "Headshots"; value: number; displayValue: string };
        defenseTraded: { displayName: "Rounds Traded"; value: number; displayValue: string };
        defenseSurvived: { displayName: "Rounds Survived"; value: number; displayValue: string };
        defenseFirstBloods: { displayName: "First Bloods"; value: number; displayValue: string };
        defenseFirstBloodsPerRound: { displayName: "First Bloods / Round"; value: number; displayValue: string };
        defenseFirstDeaths: { displayName: "First Deaths"; value: number; displayValue: string };
        defenseFirstDeathsPerRound: { displayName: "First Deaths / Round"; value: number; displayValue: string };
        defenseEsr: { displayName: "ESR"; value: number; displayValue: string };
        defenseKAST: { displayName: "KAST"; value: number; displayValue: string };
        rank: {
            displayName: "Rating";
            metadata: {
                iconUrl: string;
                tierName: string;
            };
        };
        trnPerformanceScore: {
            displayName: "Performance Score";
            metadata: { stats: string[] };
            value: number;
            displayValue: string;
        };
        peakRank: {
            displayName: "Peak Rating";
            category: "mmr";
            metadata: {
                iconUrl: string;
                tierName: string;
                actId: string;
                actName: string;
            };
            value: number | null;
            displayValue: string;
            displayType: "String";
        };
    };
}

interface PeakRatingSegment {
    type: "peak-rating",
    attributes: {
        playlist: "competitive"
    },
    stats: {
        peakRating: {
            displayName: "Peak Rating",
            metadata: {
                iconUrl: string,
                tierName: string,
                actId: string,
                actName: string
            },
            value: null,
            displayValue: string,
        }
    }
}

interface AgentSegment {
    type: "agent",
    attributes: {
        key: string;
        seasonId: string;
        playlist: string;
    },
    metadata: {
        name: string;
        imageUrl: string;
        role: string;
        color: HexColorString;
        abilities: {
            Ability1: AbilityData;
            Ability2: AbilityData;
            Grenade: AbilityData;
            Ultimate: AbilityData;
            Passive: AbilityData;
        },
        schema: string;
    },
    stats: {
        matchesPlayed: {
            displayName: "Matches Played",
            value: number,
            displayValue: string
        },
        matchesWon: {
            displayName: "Wins",
            value: number,
            displayValue: string
        },
        matchesLost: {
            displayName: "Losses",
            value: number,
            displayValue: string
        },
        matchesTied: {
            displayName: "Ties",
            value: number,
            displayValue: string
        },
        matchesWinPct: {
            displayName: "Win %",
            value: number,
            displayValue: string
        },
        matchesDisconnected: {
            displayName: "Disconnects",
            value: number,
            displayValue: string
        },
        matchesDuration: {
            displayName: "Matches Duration",
            value: number,
            displayValue: string
        },
        timePlayed: {
            displayName: "Time Played",
            value: number,
            displayValue: string
        },
        mVPs: {
            displayName: "MVPs",
            value: number,
            displayValue: string
        },
        roundsPlayed: {
            displayName: "Rounds Played",
            value: number,
            displayValue: string
        },
        roundsWon: {
            displayName: "Rounds Won",
            value: number,
            displayValue: string
        },
        roundsLost: {
            displayName: "Rounds Lost",
            value: number,
            displayValue: string
        },
        roundsWinPct: {
            displayName: "Round Win %",
            value: number,
            displayValue: string
        },
        roundsDuration: {
            displayName: "Rounds Duration",
            value: number,
            displayValue: string
        },
        score: {
            displayName: "Score",
            value: number,
            displayValue: string
        },
        scorePerMatch: {
            displayName: "Score/Match",
            value: number,
            displayValue: string
        },
        scorePerRound: {
            displayName: "ACS",
            value: number,
            displayValue: string
        },
        kills: {
            displayName: "Kills",
            value: number,
            displayValue: string
        },
        killsPerRound: {
            displayName: "Kills/Round",
            value: number,
            displayValue: string
        },
        killsPerMatch: {
            displayName: "Kills/Match",
            value: number,
            displayValue: string
        },
        deaths: {
            displayName: "Deaths",
            value: number,
            displayValue: string
        },
        deathsPerRound: {
            displayName: "Deaths/Round",
            value: number,
            displayValue: string
        },
        deathsPerMatch: {
            displayName: "Deaths/Match",
            value: number,
            displayValue: string
        },
        assists: {
            displayName: "Assists",
            value: number,
            displayValue: string
        },
        assistsPerRound: {
            displayName: "Assists/Round",
            value: number,
            displayValue: string
        },
        assistsPerMatch: {
            displayName: "Assists/Match",
            value: number,
            displayValue: string
        },
        kDRatio: {
            displayName: "K/D Ratio",
            value: number,
            displayValue: string
        },
        kDARatio: {
            displayName: "KDA Ratio",
            value: number,
            displayValue: string
        },
        kADRatio: {
            displayName: "KAD Ratio",
            value: number,
            displayValue: string
        },
        damage: {
            displayName: "Damage",
            value: number,
            displayValue: string
        },
        damageDelta: {
            displayName: "Damage Delta Δ",
            value: number,
            displayValue: string
        },
        damageDeltaPerRound: {
            displayName: "DDΔ/Round",
            "description": "Damage Dealt - Damage Received, averaged over Rounds played",
            value: number,
            displayValue: string
        },
        damagePerRound: {
            displayName: "Damage/Round",
            value: number,
            displayValue: string
        },
        damagePerMatch: {
            displayName: "Damage/Match",
            value: number,
            displayValue: string
        },
        damagePerMinute: {
            displayName: "Damage/Minute",
            value: number,
            displayValue: string
        },
        damageReceived: {
            displayName: "Damage Received",
            value: number,
            displayValue: string
        },
        headshots: {
            displayName: "Headshots",
            value: number,
            displayValue: string
        },
        headshotsPerRound: {
            displayName: "Headshots/Round",
            value: number,
            displayValue: string
        },
        headshotsPercentage: {
            displayName: "Headshot %",
            value: number,
            displayValue: string
        },
        grenadeCasts: {
            displayName: "Grenade Casts",
            value: number,
            displayValue: string
        },
        grenadeCastsPerRound: {
            displayName: "Grenade Casts / Round",
            value: number,
            displayValue: string
        },
        grenadeCastsPerMatch: {
            displayName: "Grenade Casts / Match",
            value: number,
            displayValue: string
        },
        ability1Casts: {
            displayName: "Ability 1 Casts",
            value: number,
            displayValue: string
        },
        ability1CastsPerRound: {
            displayName: "Ability 1 Casts / Round",
            value: number,
            displayValue: string
        },
        ability1CastsPerMatch: {
            displayName: "Ability 1 Casts / Match",
            value: number,
            displayValue: string
        },
        ability2Casts: {
            displayName: "Ability 2 Casts",
            value: number,
            displayValue: string
        },
        ability2CastsPerRound: {
            displayName: "Ability 2 Casts / Round",
            value: number,
            displayValue: string
        },
        ability2CastsPerMatch: {
            displayName: "Ability 2 Casts / Match",
            value: number,
            displayValue: string
        },
        ultimateCasts: {
            displayName: "Ultimate Casts",
            value: number,
            displayValue: string
        },
        ultimateCastsPerRound: {
            displayName: "Ultimate Casts / Round",
            value: number,
            displayValue: string
        },
        ultimateCastsPerMatch: {
            displayName: "Ultimate Casts / Match",
            value: number,
            displayValue: string
        },
        dealtHeadshots: {
            displayName: "Dealt Headshots",
            value: number,
            displayValue: string
        },
        dealtBodyshots: {
            displayName: "Dealt Bodyshots",
            value: number,
            displayValue: string
        },
        dealtLegshots: {
            displayName: "Dealt Legshots",
            value: number,
            displayValue: string
        },
        receivedHeadshots: {
            displayName: "Received Headshots",
            value: number,
            displayValue: string
        },
        receivedBodyshots: {
            displayName: "Received Bodyshots",
            value: number,
            displayValue: string
        },
        receivedLegshots: {
            displayName: "Received Legshots",
            value: number,
            displayValue: string
        },
        econRating: {
            displayName: "Econ Rating",
            value: number,
            displayValue: string
        },
        econRatingPerMatch: {
            displayName: "Econ Rating / Match",
            value: number,
            displayValue: string
        },
        econRatingPerRound: {
            displayName: "Econ Rating / Round",
            value: number,
            displayValue: string
        },
        suicides: {
            displayName: "Suicides",
            value: number,
            displayValue: string
        },
        firstBloods: {
            displayName: "First Bloods",
            value: number,
            displayValue: string
        },
        firstBloodsPerRound: {
            displayName: "First Bloods / Round",
            value: number,
            displayValue: string
        },
        firstBloodsPerMatch: {
            displayName: "First Bloods / Match",
            value: number,
            displayValue: string
        },
        firstDeaths: {
            displayName: "First Deaths",
            value: number,
            displayValue: string
        },
        firstDeathsPerRound: {
            displayName: "First Deaths / Round",
            value: number,
            displayValue: string
        },
        lastDeaths: {
            displayName: "Last Deaths",
            value: number,
            displayValue: string
        },
        survived: {
            displayName: "Rounds Survived",
            value: number,
            displayValue: string
        },
        traded: {
            displayName: "Rounds Traded",
            value: number,
            displayValue: string
        },
        kAST: {
            displayName: "KAST",
            "description": "Percent of Rounds where you got a Kill, Assist, Survived or Traded",
            value: number,
            displayValue: string
        },
        mostKillsInMatch: {
            displayName: "Most Kills (Match)",
            value: number,
            displayValue: string
        },
        flawless: {
            displayName: "Flawless Rounds",
            value: number,
            displayValue: string
        },
        thrifty: {
            displayName: "Thrifty Rounds",
            value: number,
            displayValue: string
        },
        aces: {
            displayName: "Aces",
            value: number,
            displayValue: string
        },
        teamAces: {
            displayName: "Team Aces",
            value: number,
            displayValue: string
        },
        clutches: {
            displayName: "Clutches",
            value: number,
            displayValue: string
        },
        clutchesPercentage: {
            displayName: "Clutch %",
            value: number,
            displayValue: string
        },
        clutchesLost: {
            displayName: "Clutches Lost",
            value: number,
            displayValue: string
        },
        clutches1v1: {
            displayName: "Clutches (1v1)",
            value: number,
            displayValue: string
        },
        clutches1v2: {
            displayName: "Clutches (1v2)",
            value: number,
            displayValue: string
        },
        clutches1v3: {
            displayName: "Clutches (1v3)",
            value: number,
            displayValue: string
        },
        clutches1v4: {
            displayName: "Clutches (1v4)",
            value: number,
            displayValue: string
        },
        clutches1v5: {
            displayName: "Clutches (1v5)",
            value: number,
            displayValue: string
        },
        clutchesLost1v1: {
            displayName: "Clutches Lost (1v1)",
            value: number,
            displayValue: string
        },
        clutchesLost1v2: {
            displayName: "Clutches Lost (1v2)",
            value: number,
            displayValue: string
        },
        clutchesLost1v3: {
            displayName: "Clutches Lost (1v3)",
            value: number,
            displayValue: string
        },
        clutchesLost1v4: {
            displayName: "Clutches Lost (1v4)",
            value: number,
            displayValue: string
        },
        clutchesLost1v5: {
            displayName: "Clutches Lost (1v5)",
            value: number,
            displayValue: string
        },
        kills1K: {
            displayName: "Multikills (1K)",
            value: number,
            displayValue: string
        },
        kills2K: {
            displayName: "Multikills (2K)",
            value: number,
            displayValue: string
        },
        kills3K: {
            displayName: "Multikills (3K)",
            value: number,
            displayValue: string
        },
        kills4K: {
            displayName: "Multikills (4K)",
            value: number,
            displayValue: string
        },
        kills5K: {
            displayName: "Multikills (5K)",
            value: number,
            displayValue: string
        },
        kills6K: {
            displayName: "Multikills (6K)",
            value: number,
            displayValue: string
        },
        esr: {
            displayName: "ESR",
            value: number,
            displayValue: string
        },
        plants: {
            displayName: "Plants",
            value: number,
            displayValue: string
        },
        plantsPerMatch: {
            displayName: "Plants/Match",
            value: number,
            displayValue: string
        },
        plantsPerRound: {
            displayName: "Plants/Round",
            value: number,
            displayValue: string
        },
        attackKills: {
            displayName: "Kills",
            value: number,
            displayValue: string
        },
        attackKillsPerRound: {
            displayName: "Kills / Round",
            value: number,
            displayValue: string
        },
        attackDeaths: {
            displayName: "Deaths / Round",
            value: number,
            displayValue: string
        },
        attackKDRatio: {
            displayName: "K/D Ratio",
            value: number,
            displayValue: string
        },
        attackAssists: {
            displayName: "Assists",
            value: number,
            displayValue: string
        },
        attackAssistsPerRound: {
            displayName: "Assists / Round",
            value: number,
            displayValue: string
        },
        attackRoundsWon: {
            displayName: "Rounds Won",
            value: number,
            displayValue: string
        },
        attackRoundsLost: {
            displayName: "Rounds Lost",
            value: number,
            displayValue: string
        },
        attackRoundsPlayed: {
            displayName: "Rounds Played",
            value: number,
            displayValue: string
        },
        attackRoundsWinPct: {
            displayName: "Round Win %",
            value: number,
            displayValue: string
        },
        attackScore: {
            displayName: "Score",
            value: number,
            displayValue: string
        },
        attackScorePerRound: {
            displayName: "ACS",
            value: number,
            displayValue: string
        },
        attackDamage: {
            displayName: "Damage",
            value: number,
            displayValue: string
        },
        attackDamageReceived: {
            displayName: "Damage Received",
            value: number,
            displayValue: string
        },
        attackDamagePerRound: {
            displayName: "Damage/Round",
            value: number,
            displayValue: string
        },
        attackDamageDelta: {
            displayName: "Damage Delta Δ",
            value: number,
            displayValue: string
        },
        attackDamageDeltaPerRound: {
            displayName: "DDΔ/Round",
            "description": "Damage Dealt - Damage Received, averaged over Rounds played",
            value: number,
            displayValue: string
        },
        attackHeadshots: {
            displayName: "Headshots",
            value: number,
            displayValue: string
        },
        attackTraded: {
            displayName: "Rounds Traded",
            value: number,
            displayValue: string
        },
        attackSurvived: {
            displayName: "Rounds Survived",
            value: number,
            displayValue: string
        },
        attackFirstBloods: {
            displayName: "First Bloods",
            value: number,
            displayValue: string
        },
        attackFirstBloodsPerRound: {
            displayName: "First Bloods / Round",
            value: number,
            displayValue: string
        },
        attackFirstDeaths: {
            displayName: "First Deaths",
            value: number,
            displayValue: string
        },
        attackFirstDeathsPerRound: {
            displayName: "First Deaths / Round",
            value: number,
            displayValue: string
        },
        attackEsr: {
            displayName: "ESR",
            value: number,
            displayValue: string
        },
        attackKAST: {
            displayName: "KAST",
            value: number,
            displayValue: string
        },
        defuses: {
            displayName: "Defuses",
            value: number,
            displayValue: string
        },
        defusesPerMatch: {
            displayName: "Defuses/Match",
            value: number,
            displayValue: string
        },
        defusesPerRound: {
            displayName: "Defuses/Round",
            value: number,
            displayValue: string
        },
        defenseKills: {
            displayName: "Kills",
            value: number,
            displayValue: string
        },
        defenseKillsPerRound: {
            displayName: "Kills/Round",
            value: number,
            displayValue: string
        },
        defenseDeaths: {
            displayName: "Deaths",
            value: number,
            displayValue: string
        },
        defenseKDRatio: {
            displayName: "K/D Ratio",
            value: number,
            displayValue: string
        },
        defenseAssists: {
            displayName: "Assists",
            value: number,
            displayValue: string
        },
        defenseAssistsPerRound: {
            displayName: "Assists/Round",
            value: number,
            displayValue: string
        },
        defenseRoundsWon: {
            displayName: "Rounds Won",
            value: number,
            displayValue: string
        },
        defenseRoundsLost: {
            displayName: "Rounds Lost",
            value: number,
            displayValue: string
        },
        defenseRoundsPlayed: {
            displayName: "Rounds Played",
            value: number,
            displayValue: string
        },
        defenseRoundsWinPct: {
            displayName: "Round Win %",
            value: number,
            displayValue: string
        },
        defenseScore: {
            displayName: "Score",
            value: number,
            displayValue: string
        },
        defenseScorePerRound: {
            displayName: "ACS",
            value: number,
            displayValue: string
        },
        defenseDamage: {
            displayName: "Damage",
            value: number,
            displayValue: string
        },
        defenseDamageReceived: {
            displayName: "Damage Received",
            value: number,
            displayValue: string
        },
        defenseDamagePerRound: {
            displayName: "Damage/Round",
            value: number,
            displayValue: string
        },
        defenseDamageDelta: {
            displayName: "Damage Delta Δ",
            value: number,
            displayValue: string
        },
        defenseDamageDeltaPerRound: {
            displayName: "DDΔ/Round",
            "description": "Damage Dealt - Damage Received, averaged over Rounds played",
            value: number,
            displayValue: string
        },
        defenseHeadshots: {
            displayName: "Headshots",
            value: number,
            displayValue: string
        },
        defenseTraded: {
            displayName: "Rounds Traded",
            value: number,
            displayValue: string
        },
        defenseSurvived: {
            displayName: "Rounds Survived",
            value: number,
            displayValue: string
        },
        defenseFirstBloods: {
            displayName: "First Bloods",
            value: number,
            displayValue: string
        },
        defenseFirstBloodsPerRound: {
            displayName: "First Bloods / Round",
            value: number,
            displayValue: string
        },
        defenseFirstDeaths: {
            displayName: "First Deaths",
            value: number,
            displayValue: string
        },
        defenseFirstDeathsPerRound: {
            displayName: "First Deaths / Round",
            value: number,
            displayValue: string
        },
        defenseEsr: {
            displayName: "ESR",
            value: number,
            displayValue: string
        },
        defenseKAST: {
            displayName: "KAST",
            value: number,
            displayValue: string
        },
        ability1Kills: {
            displayName: "Ability Kills",
            value: number,
            displayValue: string
        },
        ability1KillsPerMatch: {
            displayName: "Ability Kils/Match",
            value: number,
            displayValue: string
        },
        ability2Kills: {
            displayName: "Ability Kills",
            value: number,
            displayValue: string
        },
        ability2KillsPerMatch: {
            displayName: "Ability Kils/Match",
            value: number,
            displayValue: string
        },
        grenadeKills: {
            displayName: "Ability Kills",
            value: number,
            displayValue: string
        },
        grenadeKillsPerMatch: {
            displayName: "Ability Kils/Match",
            value: number,
            displayValue: string
        },
        primaryKills: {
            displayName: "Ability Kills",
            value: number,
            displayValue: string
        },
        primaryKillsPerMatch: {
            displayName: "Ability Kils/Match",
            value: number,
            displayValue: string
        },
        ultimateKills: {
            displayName: "Ability Kills",
            value: number,
            displayValue: string
        },
        ultimateKillsPerMatch: {
            displayName: "Ability Kils/Match",
            value: number,
            displayValue: string
        },
        pickRate: {
            displayName: "Pick %",
            value: number,
            displayValue: string
        }
    }
}

interface AgentRoleSegment {
    type: "agent-role",
    attributes: {
        key: string;
        seasonId: string;
        playlist: string;
    },
    metadata: {
        name: string,
        imageUrl: string
    },
    stats: {
        matchesPlayed: {
            displayName: "Matches Played",
            value: number,
            displayValue: string
        },
        matchesWon: {
            displayName: "Wins",
            value: number,
            displayValue: string
        },
        matchesLost: {
            displayName: "Losses",
            value: number,
            displayValue: string
        },
        matchesTied: {
            displayName: "Ties",
            value: number,
            displayValue: string
        },
        matchesWinPct: {
            displayName: "Win %",
            value: number,
            displayValue: string
        },
        timePlayed: {
            displayName: "Time Played",
            value: number,
            displayValue: string
        },
        scorePerRound: {
            displayName: "ACS",
            value: number,
            displayValue: string
        },
        kills: {
            displayName: "Kills",
            value: number,
            displayValue: string
        },
        deaths: {
            displayName: "Deaths",
            value: number,
            displayValue: string
        },
        assists: {
            displayName: "Assists",
            value: number,
            displayValue: string
        },
        kDRatio: {
            displayName: "K/D Ratio",
            value: number,
            displayValue: string
        },
        kADRatio: {
            displayName: "KAD Ratio",
            value: number,
            displayValue: string
        },
        damageDelta: {
            displayName: "Damage Delta Δ",
            value: number,
            displayValue: string
        },
        damageDeltaPerRound: {
            displayName: "DDΔ/Round",
            "description": "Damage Dealt - Damage Received, averaged over Rounds played",
            value: number,
            displayValue: string
        },
        damagePerRound: {
            displayName: "Damage/Round",
            value: number,
            displayValue: string
        },
        kAST: {
            displayName: "KAST",
            "description": "Percent of Rounds where you got a Kill, Assist, Survived or Traded",
            value: number,
            displayValue: string
        }
    }
}

interface AgentTopMapSegment {
    type: "agent-top-map",
    attributes: {
        key: string;
        playlist: string;
        seasonId: string;
        mapKey: string;
    },
    metadata: {
        name: string;
        imageUrl: string;
        color: HexColorString;
        schema; string;
    },
    stats: {
        "matchesPlayed": {
            displayName: "Matches Played",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 2,
            "displayValue": "2",
            "displayType": "Number"
        },
        "matchesWon": {
            displayName: "Wins",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1",
            "displayType": "Number"
        },
        "matchesLost": {
            displayName: "Losses",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "matchesTied": {
            displayName: "Ties",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1",
            "displayType": "Number"
        },
        "matchesWinPct": {
            displayName: "Win %",
            "displayCategory": "Game",
            "category": "game",

            "value": 50,
            "displayValue": "50.0%",
            "displayType": "NumberPercentage"
        },
        "matchesDisconnected": {
            displayName: "Disconnects",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "matchesDuration": {
            displayName: "Matches Duration",
            "displayCategory": "Game",
            "category": "game",

            "value": 2679,
            "displayValue": "44m 39s",
            "displayType": "TimeSeconds"
        },
        "timePlayed": {
            displayName: "Time Played",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 5358,
            "displayValue": "1h 29m",
            "displayType": "TimeSeconds"
        },
        "mVPs": {
            displayName: "MVPs",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "roundsPlayed": {
            displayName: "Rounds Played",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 54,
            "displayValue": "54",
            "displayType": "Number"
        },
        "roundsWon": {
            displayName: "Rounds Won",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 28,
            "displayValue": "28",
            "displayType": "Number"
        },
        "roundsLost": {
            displayName: "Rounds Lost",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 26,
            "displayValue": "26",
            "displayType": "Number"
        },
        "roundsWinPct": {
            displayName: "Round Win %",
            "displayCategory": "Game",
            "category": "game",

            "value": 51.85185185185185,
            "displayValue": "51.9%",
            "displayType": "NumberPercentage"
        },
        "roundsDuration": {
            displayName: "Rounds Duration",
            "displayCategory": "Game",
            "category": "game",

            "value": 99.22222222222223,
            "displayValue": "01m 39s",
            "displayType": "TimeSeconds"
        },
        "score": {
            displayName: "Score",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 8068,
            "displayValue": "8,068",
            "displayType": "Number"
        },
        "scorePerMatch": {
            displayName: "Score/Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 4034,
            "displayValue": "4,034",
            "displayType": "Number"
        },
        "scorePerRound": {
            displayName: "ACS",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 149.40740740740742,
            "displayValue": "149.4",
            "displayType": "NumberPrecision1"
        },
        "kills": {
            displayName: "Kills",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 26,
            "displayValue": "26",
            "displayType": "Number"
        },
        "killsPerRound": {
            displayName: "Kills/Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.48148148148148145,
            "displayValue": "0.5",
            "displayType": "NumberPrecision1"
        },
        "killsPerMatch": {
            displayName: "Kills/Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 13,
            "displayValue": "13.0",
            "displayType": "NumberPrecision1"
        },
        "deaths": {
            displayName: "Deaths",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 40,
            "displayValue": "40",
            "displayType": "Number"
        },
        "deathsPerRound": {
            displayName: "Deaths/Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.7407407407407407,
            "displayValue": "0.7",
            "displayType": "NumberPrecision1"
        },
        "deathsPerMatch": {
            displayName: "Deaths/Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 20,
            "displayValue": "20.0",
            "displayType": "NumberPrecision1"
        },
        "assists": {
            displayName: "Assists",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 14,
            "displayValue": "14",
            "displayType": "Number"
        },
        "assistsPerRound": {
            displayName: "Assists/Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.25925925925925924,
            "displayValue": "0.3",
            "displayType": "NumberPrecision1"
        },
        "assistsPerMatch": {
            displayName: "Assists/Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 7,
            "displayValue": "7.0",
            "displayType": "NumberPrecision1"
        },
        "kDRatio": {
            displayName: "K/D Ratio",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.65,
            "displayValue": "0.65",
            "displayType": "NumberPrecision2"
        },
        "kDARatio": {
            displayName: "KDA Ratio",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.825,
            "displayValue": "0.82",
            "displayType": "NumberPrecision2"
        },
        "kADRatio": {
            displayName: "KAD Ratio",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1.00",
            "displayType": "NumberPrecision2"
        },
        "damage": {
            displayName: "Damage",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 6108,
            "displayValue": "6,108",
            "displayType": "Number"
        },
        "damageDelta": {
            displayName: "Damage Delta Δ",
            "displayCategory": "Combat",
            "category": "combat",

            "value": -636,
            "displayValue": "-636",
            "displayType": "Number"
        },
        "damageDeltaPerRound": {
            displayName: "DDΔ/Round",
            "displayCategory": "Combat",
            "category": "combat",
            "description": "Damage Dealt - Damage Received, averaged over Rounds played",

            "value": -11.777777777777779,
            "displayValue": "-12",
            "displayType": "Number"
        },
        "damagePerRound": {
            displayName: "Damage/Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 113.11111111111111,
            "displayValue": "113.1",
            "displayType": "NumberPrecision1"
        },
        "damagePerMatch": {
            displayName: "Damage/Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 3054,
            "displayValue": "3,054.00",
            "displayType": "NumberPrecision2"
        },
        "damagePerMinute": {
            displayName: "Damage/Minute",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 68.62921348314607,
            "displayValue": "68.6",
            "displayType": "NumberPrecision1"
        },
        "damageReceived": {
            displayName: "Damage Received",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 6744,
            "displayValue": "6,744",
            "displayType": "Number"
        },
        "headshots": {
            displayName: "Headshots",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 17,
            "displayValue": "17",
            "displayType": "Number"
        },
        "headshotsPerRound": {
            displayName: "Headshots/Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.3148148148148148,
            "displayValue": "0.3",
            "displayType": "NumberPrecision1"
        },
        "headshotsPercentage": {
            displayName: "Headshot %",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 19.26605504587156,
            "displayValue": "19.3%",
            "displayType": "NumberPercentage"
        },
        "grenadeCasts": {
            displayName: "Grenade Casts",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 66,
            "displayValue": "66",
            "displayType": "Number"
        },
        "grenadeCastsPerRound": {
            displayName: "Grenade Casts / Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1.2222222222222223,
            "displayValue": "1.2",
            "displayType": "NumberPrecision1"
        },
        "grenadeCastsPerMatch": {
            displayName: "Grenade Casts / Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 33,
            "displayValue": "33.00",
            "displayType": "NumberPrecision2"
        },
        "ability1Casts": {
            displayName: "Ability 1 Casts",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 57,
            "displayValue": "57",
            "displayType": "Number"
        },
        "ability1CastsPerRound": {
            displayName: "Ability 1 Casts / Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1.0555555555555556,
            "displayValue": "1.1",
            "displayType": "NumberPrecision1"
        },
        "ability1CastsPerMatch": {
            displayName: "Ability 1 Casts / Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 28.5,
            "displayValue": "28.50",
            "displayType": "NumberPrecision2"
        },
        "ability2Casts": {
            displayName: "Ability 2 Casts",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 40,
            "displayValue": "40",
            "displayType": "Number"
        },
        "ability2CastsPerRound": {
            displayName: "Ability 2 Casts / Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.7407407407407407,
            "displayValue": "0.7",
            "displayType": "NumberPrecision1"
        },
        "ability2CastsPerMatch": {
            displayName: "Ability 2 Casts / Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 20,
            "displayValue": "20.00",
            "displayType": "NumberPrecision2"
        },
        "ultimateCasts": {
            displayName: "Ultimate Casts",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 6,
            "displayValue": "6",
            "displayType": "Number"
        },
        "ultimateCastsPerRound": {
            displayName: "Ultimate Casts / Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.1111111111111111,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "ultimateCastsPerMatch": {
            displayName: "Ultimate Casts / Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 3,
            "displayValue": "3.00",
            "displayType": "NumberPrecision2"
        },
        "dealtHeadshots": {
            displayName: "Dealt Headshots",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 21,
            "displayValue": "21",
            "displayType": "Number"
        },
        "dealtBodyshots": {
            displayName: "Dealt Bodyshots",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 83,
            "displayValue": "83",
            "displayType": "Number"
        },
        "dealtLegshots": {
            displayName: "Dealt Legshots",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 5,
            "displayValue": "5",
            "displayType": "Number"
        },
        "receivedHeadshots": {
            displayName: "Received Headshots",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 33,
            "displayValue": "33",
            "displayType": "Number"
        },
        "receivedBodyshots": {
            displayName: "Received Bodyshots",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 54,
            "displayValue": "54",
            "displayType": "Number"
        },
        "receivedLegshots": {
            displayName: "Received Legshots",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 3,
            "displayValue": "3",
            "displayType": "Number"
        },
        "econRating": {
            displayName: "Econ Rating",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 86,
            "displayValue": "86",
            "displayType": "Number"
        },
        "econRatingPerMatch": {
            displayName: "Econ Rating / Match",
            "displayCategory": "Game",
            "category": "game",

            "value": 43,
            "displayValue": "43",
            "displayType": "Number"
        },
        "econRatingPerRound": {
            displayName: "Econ Rating / Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1.5925925925925926,
            "displayValue": "1.6",
            "displayType": "NumberPrecision1"
        },
        "suicides": {
            displayName: "Suicides",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "firstBloods": {
            displayName: "First Bloods",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 3,
            "displayValue": "3",
            "displayType": "Number"
        },
        "firstBloodsPerRound": {
            displayName: "First Bloods / Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.05555555555555555,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "firstBloodsPerMatch": {
            displayName: "First Bloods / Match",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1.5,
            "displayValue": "1.50",
            "displayType": "NumberPrecision2"
        },
        "firstDeaths": {
            displayName: "First Deaths",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 5,
            "displayValue": "5",
            "displayType": "Number"
        },
        "firstDeathsPerRound": {
            displayName: "First Deaths / Round",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.09259259259259259,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "lastDeaths": {
            displayName: "Last Deaths",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 6,
            "displayValue": "6",
            "displayType": "Number"
        },
        "survived": {
            displayName: "Rounds Survived",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 14,
            "displayValue": "14",
            "displayType": "Number"
        },
        "traded": {
            displayName: "Rounds Traded",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 10,
            "displayValue": "10",
            "displayType": "Number"
        },
        "kAST": {
            displayName: "KAST",
            "displayCategory": "Combat",
            "category": "combat",
            "description": "Percent of Rounds where you got a Kill, Assist, Survived or Traded",

            "value": 68.52,
            "displayValue": "68.5%",
            "displayType": "NumberPercentage"
        },
        "mostKillsInMatch": {
            displayName: "Most Kills (Match)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 16,
            "displayValue": "16",
            "displayType": "Number"
        },
        "flawless": {
            displayName: "Flawless Rounds",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 2,
            "displayValue": "2",
            "displayType": "Number"
        },
        "thrifty": {
            displayName: "Thrifty Rounds",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1",
            "displayType": "Number"
        },
        "aces": {
            displayName: "Aces",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "teamAces": {
            displayName: "Team Aces",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "clutches": {
            displayName: "Clutches",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 2,
            "displayValue": "2",
            "displayType": "Number"
        },
        "clutchesPercentage": {
            displayName: "Clutch %",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 3.7037037037037033,
            "displayValue": "3.7%",
            "displayType": "NumberPercentage"
        },
        "clutchesLost": {
            displayName: "Clutches Lost",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 6,
            "displayValue": "6",
            "displayType": "Number"
        },
        "clutches1v1": {
            displayName: "Clutches (1v1)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1",
            "displayType": "Number"
        },
        "clutches1v2": {
            displayName: "Clutches (1v2)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1",
            "displayType": "Number"
        },
        "clutches1v3": {
            displayName: "Clutches (1v3)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "clutches1v4": {
            displayName: "Clutches (1v4)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "clutches1v5": {
            displayName: "Clutches (1v5)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "clutchesLost1v1": {
            displayName: "Clutches Lost (1v1)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1",
            "displayType": "Number"
        },
        "clutchesLost1v2": {
            displayName: "Clutches Lost (1v2)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 1,
            "displayValue": "1",
            "displayType": "Number"
        },
        "clutchesLost1v3": {
            displayName: "Clutches Lost (1v3)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "clutchesLost1v4": {
            displayName: "Clutches Lost (1v4)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 2,
            "displayValue": "2",
            "displayType": "Number"
        },
        "clutchesLost1v5": {
            displayName: "Clutches Lost (1v5)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 2,
            "displayValue": "2",
            "displayType": "Number"
        },
        "kills1K": {
            displayName: "Multikills (1K)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 14,
            "displayValue": "14",
            "displayType": "Number"
        },
        "kills2K": {
            displayName: "Multikills (2K)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 6,
            "displayValue": "6",
            "displayType": "Number"
        },
        "kills3K": {
            displayName: "Multikills (3K)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "kills4K": {
            displayName: "Multikills (4K)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "kills5K": {
            displayName: "Multikills (5K)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "kills6K": {
            displayName: "Multikills (6K)",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "esr": {
            displayName: "ESR",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 0.375,
            "displayValue": "0.38",
            "displayType": "NumberPrecision2"
        },
        "plants": {
            displayName: "Plants",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 4,
            "displayValue": "4",
            "displayType": "Number"
        },
        "plantsPerMatch": {
            displayName: "Plants/Match",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 2,
            "displayValue": "2.00",
            "displayType": "NumberPrecision2"
        },
        "plantsPerRound": {
            displayName: "Plants/Round",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 0.14814814814814814,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "attackKills": {
            displayName: "Kills",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 9,
            "displayValue": "9",
            "displayType": "Number"
        },
        "attackKillsPerRound": {
            displayName: "Kills / Round",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 0.3333333333333333,
            "displayValue": "0.3",
            "displayType": "NumberPrecision1"
        },
        "attackDeaths": {
            displayName: "Deaths / Round",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 22,
            "displayValue": "22",
            "displayType": "Number"
        },
        "attackKDRatio": {
            displayName: "K/D Ratio",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 0.4090909090909091,
            "displayValue": "0.41",
            "displayType": "NumberPrecision2"
        },
        "attackAssists": {
            displayName: "Assists",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 5,
            "displayValue": "5",
            "displayType": "Number"
        },
        "attackAssistsPerRound": {
            displayName: "Assists / Round",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 0.18518518518518517,
            "displayValue": "0.2",
            "displayType": "NumberPrecision1"
        },
        "attackRoundsWon": {
            displayName: "Rounds Won",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 11,
            "displayValue": "11",
            "displayType": "Number"
        },
        "attackRoundsLost": {
            displayName: "Rounds Lost",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 16,
            "displayValue": "16",
            "displayType": "Number"
        },
        "attackRoundsPlayed": {
            displayName: "Rounds Played",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 27,
            "displayValue": "27",
            "displayType": "Number"
        },
        "attackRoundsWinPct": {
            displayName: "Round Win %",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 40.74074074074074,
            "displayValue": "40.7%",
            "displayType": "NumberPercentage"
        },
        "attackScore": {
            displayName: "Score",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 2983,
            "displayValue": "2,983",
            "displayType": "Number"
        },
        "attackScorePerRound": {
            displayName: "ACS",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 110.48148148148148,
            "displayValue": "110.5",
            "displayType": "NumberPrecision1"
        },
        "attackDamage": {
            displayName: "Damage",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 2075,
            "displayValue": "2,075",
            "displayType": "Number"
        },
        "attackDamageReceived": {
            displayName: "Damage Received",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 3588,
            "displayValue": "3,588",
            "displayType": "Number"
        },
        "attackDamagePerRound": {
            displayName: "Damage/Round",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 76.85185185185185,
            "displayValue": "76.9",
            "displayType": "NumberPrecision1"
        },
        "attackDamageDelta": {
            displayName: "Damage Delta Δ",
            "displayCategory": "Attack",
            "category": "attack",

            "value": -1513,
            "displayValue": "-1,513",
            "displayType": "Number"
        },
        "attackDamageDeltaPerRound": {
            displayName: "DDΔ/Round",
            "displayCategory": "Attack",
            "category": "attack",
            "description": "Damage Dealt - Damage Received, averaged over Rounds played",

            "value": -56.03703703703704,
            "displayValue": "-56",
            "displayType": "Number"
        },
        "attackHeadshots": {
            displayName: "Headshots",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 4,
            "displayValue": "4",
            "displayType": "Number"
        },
        "attackTraded": {
            displayName: "Rounds Traded",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 6,
            "displayValue": "6",
            "displayType": "Number"
        },
        "attackSurvived": {
            displayName: "Rounds Survived",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 5,
            "displayValue": "5",
            "displayType": "Number"
        },
        "attackFirstBloods": {
            displayName: "First Bloods",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 3,
            "displayValue": "3",
            "displayType": "Number"
        },
        "attackFirstBloodsPerRound": {
            displayName: "First Bloods / Round",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 0.1111111111111111,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "attackFirstDeaths": {
            displayName: "First Deaths",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 2,
            "displayValue": "2",
            "displayType": "Number"
        },
        "attackFirstDeathsPerRound": {
            displayName: "First Deaths / Round",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 0.07407407407407407,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "attackEsr": {
            displayName: "ESR",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 0.6,
            "displayValue": "0.60",
            "displayType": "NumberPrecision2"
        },
        "attackKAST": {
            displayName: "KAST",
            "displayCategory": "Attack",
            "category": "attack",

            "value": 70.37,
            "displayValue": "70.4%",
            "displayType": "NumberPercentage"
        },
        "defuses": {
            displayName: "Defuses",
            "displayCategory": "Combat",
            "category": "combat",

            "value": 3,
            "displayValue": "3",
            "displayType": "Number"
        },
        "defusesPerMatch": {
            displayName: "Defuses/Match",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 1.5,
            "displayValue": "1.50",
            "displayType": "NumberPrecision2"
        },
        "defusesPerRound": {
            displayName: "Defuses/Round",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0.1111111111111111,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "defenseKills": {
            displayName: "Kills",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 17,
            "displayValue": "17",
            "displayType": "Number"
        },
        "defenseKillsPerRound": {
            displayName: "Kills/Round",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0.6296296296296297,
            "displayValue": "0.6",
            "displayType": "NumberPrecision1"
        },
        "defenseDeaths": {
            displayName: "Deaths",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 18,
            "displayValue": "18",
            "displayType": "Number"
        },
        "defenseKDRatio": {
            displayName: "K/D Ratio",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0.9444444444444444,
            "displayValue": "0.94",
            "displayType": "NumberPrecision2"
        },
        "defenseAssists": {
            displayName: "Assists",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 9,
            "displayValue": "9",
            "displayType": "Number"
        },
        "defenseAssistsPerRound": {
            displayName: "Assists/Round",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0.3333333333333333,
            "displayValue": "0.3",
            "displayType": "NumberPrecision1"
        },
        "defenseRoundsWon": {
            displayName: "Rounds Won",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 17,
            "displayValue": "17",
            "displayType": "Number"
        },
        "defenseRoundsLost": {
            displayName: "Rounds Lost",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 10,
            "displayValue": "10",
            "displayType": "Number"
        },
        "defenseRoundsPlayed": {
            displayName: "Rounds Played",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 27,
            "displayValue": "27",
            "displayType": "Number"
        },
        "defenseRoundsWinPct": {
            displayName: "Round Win %",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 62.96296296296296,
            "displayValue": "63.0%",
            "displayType": "NumberPercentage"
        },
        "defenseScore": {
            displayName: "Score",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 5085,
            "displayValue": "5,085",
            "displayType": "Number"
        },
        "defenseScorePerRound": {
            displayName: "ACS",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 188.33333333333334,
            "displayValue": "188.3",
            "displayType": "NumberPrecision1"
        },
        "defenseDamage": {
            displayName: "Damage",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 4033,
            "displayValue": "4,033",
            "displayType": "Number"
        },
        "defenseDamageReceived": {
            displayName: "Damage Received",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 3156,
            "displayValue": "3,156",
            "displayType": "Number"
        },
        "defenseDamagePerRound": {
            displayName: "Damage/Round",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 149.37037037037038,
            "displayValue": "149.4",
            "displayType": "NumberPrecision1"
        },
        "defenseDamageDelta": {
            displayName: "Damage Delta Δ",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 877,
            "displayValue": "877",
            "displayType": "Number"
        },
        "defenseDamageDeltaPerRound": {
            displayName: "DDΔ/Round",
            "displayCategory": "Defense",
            "category": "defense",
            "description": "Damage Dealt - Damage Received, averaged over Rounds played",

            "value": 32.48148148148148,
            "displayValue": "32",
            "displayType": "Number"
        },
        "defenseHeadshots": {
            displayName: "Headshots",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 13,
            "displayValue": "13",
            "displayType": "Number"
        },
        "defenseTraded": {
            displayName: "Rounds Traded",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 4,
            "displayValue": "4",
            "displayType": "Number"
        },
        "defenseSurvived": {
            displayName: "Rounds Survived",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 9,
            "displayValue": "9",
            "displayType": "Number"
        },
        "defenseFirstBloods": {
            displayName: "First Bloods",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0,
            "displayValue": "0",
            "displayType": "Number"
        },
        "defenseFirstBloodsPerRound": {
            displayName: "First Bloods / Round",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0,
            "displayValue": "0.0",
            "displayType": "NumberPrecision1"
        },
        "defenseFirstDeaths": {
            displayName: "First Deaths",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 3,
            "displayValue": "3",
            "displayType": "Number"
        },
        "defenseFirstDeathsPerRound": {
            displayName: "First Deaths / Round",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0.1111111111111111,
            "displayValue": "0.1",
            "displayType": "NumberPrecision1"
        },
        "defenseEsr": {
            displayName: "ESR",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 0,
            "displayValue": "0.00",
            "displayType": "NumberPrecision2"
        },
        "defenseKAST": {
            displayName: "KAST",
            "displayCategory": "Defense",
            "category": "defense",

            "value": 66.67,
            "displayValue": "66.7%",
            "displayType": "NumberPercentage"
        }
    }
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
        agentcolor: HexColorString
        agentImageUrl: string
        agentPortraitUrl: string
        platformInfo: ProfileData
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
        platformInfo: ProfileData
        opponentPlatformInfo: ProfileData
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
        agentcolor: HexColorString
        agentImageUrl: string
        agentPortraitUrl: string
        countryCode: string
        platformInfo: ProfileData
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
        platformInfo: ProfileData
        opponentPlatformInfo: ProfileData
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