package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.membership.AddMemberRequestDTO;
import com.tripnest.tripnest_backend.dto.membership.MemberResponseDTO;
import com.tripnest.tripnest_backend.dto.membership.UpdateMemberRoleRequestDTO;
import com.tripnest.tripnest_backend.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/members")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @PostMapping
    public ResponseEntity<MemberResponseDTO> addMember(
            @PathVariable Long tripId,
            @Valid @RequestBody AddMemberRequestDTO dto,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        MemberResponseDTO response = membershipService.addMember(tripId, dto, requesterEmail);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<MemberResponseDTO>> getTripMembers(
            @PathVariable Long tripId,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        List<MemberResponseDTO> members = membershipService.getTripMembers(tripId, requesterEmail);
        return ResponseEntity.ok(members);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long tripId,
            @PathVariable Long userId,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        membershipService.removeMember(tripId, userId, requesterEmail);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<MemberResponseDTO> updateMemberRole(
            @PathVariable Long tripId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateMemberRoleRequestDTO dto,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        MemberResponseDTO updated = membershipService.updateMemberRole(tripId, userId, dto, requesterEmail);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/accept")
    public ResponseEntity<MemberResponseDTO> acceptInvitation(
            @PathVariable Long tripId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        MemberResponseDTO accepted = membershipService.acceptInvitation(tripId, userEmail);
        return ResponseEntity.ok(accepted);
    }

    @PostMapping("/reject")
    public ResponseEntity<Void> rejectInvitation(
            @PathVariable Long tripId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        membershipService.rejectInvitation(tripId, userEmail);
        return ResponseEntity.ok().build();
    }
}
