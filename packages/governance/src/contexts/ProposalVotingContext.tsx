import React, {createContext, useContext, useState} from 'react'

export const VOTE_PERCENTAGE_OPTIONS = [
  { label: '15%', value: 1_500 },
  { label: '30%', value: 3_000 },
  { label: '100%', value: 10_000 },
];


export interface ProposalVotingContextState {
  votePercentage: number,
  setVotePercentage: Function
}

const ProposalVotingContext = createContext<ProposalVotingContextState | null>(null)

export default function ProposalVotingProvider({ children = null as any }) {
  const [votePercentage, setVotePercentage] = useState(VOTE_PERCENTAGE_OPTIONS[0].value)
  return (
    <ProposalVotingContext.Provider
      value={{
        votePercentage,
        setVotePercentage
      }}
    >
      {children}
    </ProposalVotingContext.Provider>
  )
}

export function useProposalVotingContext() {
  const context = useContext(ProposalVotingContext);
  return context as ProposalVotingContextState;
}