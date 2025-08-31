// src/styles.js
import styled from "styled-components";

export const Container = styled.div`
  min-height: 100vh;
  background-color: #f9fafb; /* gray-50 */
  color: #111827; /* gray-900 */
  padding: 1rem 2rem;
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  background-color: ${({ bg }) => bg || "#fff"};
  color: ${({ color }) => color || "#111"};
  border: 1px solid ${({ ring }) => ring || "#ddd"};
`;

export const ControlButton = styled.button`
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: white;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  &:hover {
    background-color: #f9fafb;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const FloorRowContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const RoomsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.5rem;
  flex: 1;
`;

export const RoomButton = styled.button`
  height: 2.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ status }) =>
    status === "booked" ? "#4f46e5" :
    status === "occupied" ? "#dc2626" :
    "#10b981"};
  color: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`;
