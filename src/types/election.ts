export interface ElectionResult {
    State_Name: string;
    Assembly_No: number;
    Constituency_No: number;
    Year: number;
    month: number;
    DelimID: number;
    Poll_No: number;
    Position: number;
    Candidate: string;
    Sex: string;
    Party: string;
    Votes: number;
    Age: number;
    Candidate_Type: string;
    Valid_Votes: number;
    Electors: number;
    Constituency_Name: string;
    Constituency_Type: string;
    District_Name: string;
    Sub_Region: string;
    N_Cand: number;
    Turnout_Percentage: number;
    Vote_Share_Percentage: number;
    Deposit_Lost: string;
    Margin: number;
    Margin_Percentage: number;
    ENOP: number;
    pid: string;
    Party_Type_TCPD: string;
    Party_ID: number;
    last_poll: boolean;
    Contested: number;
    Last_Party: string;
    Last_Party_ID: number;
    Last_Constituency_Name: string;
    Same_Constituency: boolean;
    Same_Party: boolean;
    No_Terms: number;
    Turncoat: boolean;
    Incumbent: boolean;
    Recontest: boolean;
    MyNeta_education: string;
    TCPD_Prof_Main: string;
    TCPD_Prof_Main_Desc: string;
    TCPD_Prof_Second: string;
    TCPD_Prof_Second_Desc: string;
    Election_Type: string;
    // Tamil Translations
    Constituency_Name_TA?: string;
    District_Name_TA?: string;
    Party_TA?: string;
    MyNeta_education_TA?: string;
    TCPD_Prof_Main_TA?: string;
    Sex_TA?: string;
}

export interface ConstituencySummary {
    Constituency_Name: string;
    District_Name: string;
    Total_Votes: number;
    Winning_Candidate: string;
    Winning_Party: string;
    Margin: number;
    Candidates: ElectionResult[];
}
