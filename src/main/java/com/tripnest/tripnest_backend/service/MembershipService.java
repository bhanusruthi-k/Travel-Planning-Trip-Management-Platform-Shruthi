package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.membership.AddMemberRequestDTO;
import com.tripnest.tripnest_backend.dto.membership.JoinRequestResponseDTO;
import com.tripnest.tripnest_backend.dto.membership.MemberResponseDTO;
import com.tripnest.tripnest_backend.dto.membership.UpdateMemberRoleRequestDTO;

import java.util.List;

public interface MembershipService {

    MemberResponseDTO addMember(Long tripId, AddMemberRequestDTO dto, String requesterEmail);

    List<MemberResponseDTO> getTripMembers(Long tripId, String requesterEmail);

    void removeMember(Long tripId, Long userId, String requesterEmail);

    MemberResponseDTO updateMemberRole(Long tripId, Long userId, UpdateMemberRoleRequestDTO dto, String requesterEmail);

    JoinRequestResponseDTO createJoinRequest(Long tripId, String requesterEmail);

    List<JoinRequestResponseDTO> getJoinRequests(Long tripId, String requesterEmail);

    JoinRequestResponseDTO approveJoinRequest(Long tripId, Long requestId, String requesterEmail);

    JoinRequestResponseDTO rejectJoinRequest(Long tripId, Long requestId, String requesterEmail);
}
