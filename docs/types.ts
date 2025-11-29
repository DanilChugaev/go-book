export interface IQuestionOption {
    text: string;
    correct?: boolean;
}

export interface IQuestion {
    text: string;
    options: IQuestionOption[];
}